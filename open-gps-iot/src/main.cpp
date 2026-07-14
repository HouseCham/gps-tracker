// =====================================================================
// LilyGo T-SIM7080G-S3 (H606) — bare-bones GPS logger.
//
// Polls the SIM7080G's integrated multi-constellation GNSS every 8
// seconds via TinyGSM and prints each fix (or "no fix yet") to
// USB-CDC. Designed as a field-debugging sketch: every state
// transition is logged with a `[<ms>][<TAG>]` prefix so a single
// `pio device monitor -b 115200` shows exactly where the firmware is
// at any moment.
//
// Pin map, PMU prologue, and PWRKEY sequence are documented in
// the Synapse vault under note-lilygo-t-sim7080g-* and
// decision-0008-gps-tracker-iot-stack.
// =====================================================================

#include <Arduino.h>
#include <esp_sleep.h>
#include <TinyGsmClient.h>
#include <XPowersLib.h>

#include "utilities.h"

// User-requested interval between GPS polls. Gives the SIM7080G
// real time to deliver a fresh fix between reads without
// busy-spinning the AT port.
static constexpr uint32_t GPS_READ_INTERVAL_MS = 8000UL;

// Modem UART baud — matches the upstream LilyGo debug examples.
static constexpr uint32_t MODEM_BAUD = 115200U;

// --- Minimal log helper -------------------------------------------
// Every line starts with `[<uptime_ms>][<TAG>]`. The TAG tells the
// reader which subsystem owns the message ("PMU", "MODEM", "GPS",
// "BOOT", "FATAL"); the message tells them what. TinyGSM keeps its
// own AT traces off Serial, so USB-CDC stays clean and grep-able.
// `Serial.printf()` only accepts `...` args — it has no `vprintf()`
// overload that takes a `va_list`. Passing a `va_list` directly to it
// makes the whole variadic part print garbage. Fix: format into a
// stack buffer with `vsnprintf` (which IS va_list-aware) first.
static void logLine(const char *tag, const char *fmt, ...) {
    Serial.printf("[%lu][%s] ", (unsigned long)millis(), tag);
    char buf[512];  // ESP32-S3 has 512 KB SRAM; 512 bytes on the stack is trivial
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(buf, sizeof(buf), fmt, ap);
    va_end(ap);
    Serial.print(buf);
    Serial.println();
}

#define LOG_I(tag, ...) logLine((tag), __VA_ARGS__)
// No separate levels for now — the tag already disambiguates.
#define LOG_W         LOG_I
#define LOG_E         LOG_I

static XPowersAXP2101 PMU;
static TinyGsm    modem(Serial1);

// =====================================================================
// AXP2101 PMU bring-up.
// =====================================================================
// Out of the box the PMU already has DC1 (ESP32 core) and DC3
// (modem) enabled. We disable every other rail so quiescent draw
// is minimal, force a clean modem power-on across cold boots, then
// enable the two rails the GPS path depends on:
//
//   * BLDO1 — 3.3 V level shifter between ESP32-S3 and the modem
//     UART. Without it, AT commands silently no-op.
//   * BLDO2 — supplies the active GNSS antenna. The onboard LNA
//     will not work without it.
//
// `disableTSPinMeasure()` is also mandatory: the H606 has no NTC,
// so without this line the AXP2101 refuses to charge the battery
// and the blue LED just blinks forever.
static bool pmuInit() {
    Wire.begin(I2C_SDA, I2C_SCL);
    if (!PMU.begin(Wire, AXP2101_SLAVE_ADDRESS, I2C_SDA, I2C_SCL)) {
        return false;
    }
    LOG_I("PMU", "AXP2101 detected @0x%02X", AXP2101_SLAVE_ADDRESS);

    PMU.disableDC2();   PMU.disableDC4();   PMU.disableDC5();
    PMU.disableALDO1(); PMU.disableALDO2(); PMU.disableALDO3(); PMU.disableALDO4();
    PMU.disableCPUSLDO(); PMU.disableDLDO1(); PMU.disableDLDO2();

    // PMU latches DC3 across deep-sleep, so on a true cold-boot
    // we have to drop and re-assert PWRKEY manually to be sure the
    // modem is actually fresh.
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED) {
        PMU.disableDC3();
        delay(200);
        LOG_I("PMU", "cold-boot: DC3 cycled");
    }

    PMU.enableBLDO1();
    PMU.enableDC3();
    PMU.enableBLDO2();
    PMU.disableTSPinMeasure();
    LOG_I("PMU", "rails ok: DC3 BLDO1 BLDO2 (modem / UART / antenna)");
    return true;
}

// =====================================================================
// SIM7080G bring-up.
// =====================================================================
// PWRKEY is active-low: pulling the line LOW for ~1 s toggles power.
// The pattern below (LOW/HIGH/LOW with the listed delays) is the
// sequence SIMCom documents in the AT reference for SIM70xx-family
// modems. After pulsing we poll `testAT` until the modem answers —
// first boot can take several seconds, hence the 10-retry budget.
static bool modemPowerOn() {
    pinMode(BOARD_MODEM_PWR_PIN, OUTPUT);
    digitalWrite(BOARD_MODEM_PWR_PIN, LOW);   delay(100);
    digitalWrite(BOARD_MODEM_PWR_PIN, HIGH);  delay(1000);
    digitalWrite(BOARD_MODEM_PWR_PIN, LOW);
    LOG_I("MODEM", "PWRKEY pulse sent (gpio=%d)", (int)BOARD_MODEM_PWR_PIN);

    for (uint8_t i = 0; i < 10; ++i) {
        if (modem.testAT(1000)) {
            LOG_I("MODEM", "AT ready after %u retries",
                  (unsigned)(i + 1));
            return true;
        }
        LOG_W("MODEM", "AT not ready (retry %u/10)", (unsigned)(i + 1));
        delay(1000);
    }
    return false;
}

// =====================================================================
// GPS reader — non-blocking polling at GPS_READ_INTERVAL_MS.
// =====================================================================
// `modem.enableGPS()` sends `AT+CGNSPWR=1` once. From then on,
// `modem.getGPS(...)` issues `AT+CGNSINF` and returns either the
// latest fix or "no fix" in roughly 100 ms — fast enough to live
// directly inside `tick()`. No NMEA parsing in firmware: TinyGSM
// fills the out-params, and the SIM7080G's own parser handles the
// multi-constellation stack (GPS + GLONASS + BeiDou + Galileo).
class GpsReader {
public:
    void begin() {
        modem.enableGPS();
        LOG_I("GPS", "enabled (AT+CGNSPWR=1)");
    }

    void tick() {
        const uint32_t now = millis();
        if ((int32_t)(nextReadMs - now) > 0) {
            return;  // interval not yet elapsed; loop is non-blocking
        }
        nextReadMs = now + GPS_READ_INTERVAL_MS;
        ++ticks;

        float lat   = 0.0f;
        float lon   = 0.0f;
        float speed = 0.0f;   // knots
        float alt   = 0.0f;   // metres
        int   vsat  = 0;      // satellites in view
        int   usat  = 0;      // satellites used
        float acc   = 0.0f;   // estimated horizontal accuracy (m)
        int   yy    = 0;
        int   mo    = 0;
        int   dd    = 0;
        int   hh    = 0;
        int   mi    = 0;
        int   ss    = 0;

        // DEBUG: dump the raw +CGNSINF response from the modem. The
        // SIM70xx driver parses this same AT command into float/int
        // out-params in `modem.getGPS(...)`, but when the parsed values
        // look obviously broken (lat pinned at one value, lon in the
        // gigabytes) the raw line tells us whether the modem is
        // returning sparse fields, malformed timestamps, or a real
        // fix we just aren't parsing right. Costs one extra AT round-
        // trip per 8 s — negligible while debugging.
        const String raw = modem.getGPSraw();
        LOG_I("GPS-RAW", "%s", raw.c_str());

        const bool ok = modem.getGPS(&lat, &lon, &speed, &alt,
                                     &vsat, &usat, &acc,
                                     &yy, &mo, &dd,
                                     &hh, &mi, &ss);

        if (ok) {
            noFixStreak = 0;
            LOG_I("GPS",
                  "FIX #%lu  lat=%.6f lon=%.6f alt=%.1fm speed=%.1fkn "
                  "sats=%d/%d acc=%.0fm utc=%04d-%02d-%02dT%02d:%02d:%02d",
                  (unsigned long)ticks, lat, lon, alt, speed,
                  usat, vsat, acc,
                  yy, mo, dd, hh, mi, ss);
        } else {
            ++noFixStreak;
            LOG_W("GPS",
                  "no fix  tick=%lu  noFixStreak=%lu  "
                  "(first fix can take minutes — try outdoors)",
                  (unsigned long)ticks, (unsigned long)noFixStreak);
        }
    }

private:
    uint32_t nextReadMs  = 0;
    uint32_t ticks       = 0;
    uint32_t noFixStreak = 0;
};

static GpsReader gps;

// =====================================================================
// Arduino lifecycle.
// =====================================================================
void setup() {
    Serial.begin(115200);
    delay(200);  // give USB-CDC time to enumerate before first print
    LOG_I("BOOT", "LilyGo T-SIM7080G-S3 (H606) GPS logger");

    if (!pmuInit()) {
        LOG_E("FATAL",
              "PMU init failed (I2C SDA=%d SCL=%d) — check wiring",
              (int)I2C_SDA, (int)I2C_SCL);
        while (true) { delay(1000); }
    }

    Serial1.begin(MODEM_BAUD, SERIAL_8N1,
                  BOARD_MODEM_RXD_PIN, BOARD_MODEM_TXD_PIN);
    LOG_I("MODEM", "UART1  RXD=%d TXD=%d  @%lu baud",
          (int)BOARD_MODEM_RXD_PIN, (int)BOARD_MODEM_TXD_PIN,
          (unsigned long)MODEM_BAUD);

    if (!modemPowerOn()) {
        LOG_E("FATAL",
              "modem did not respond to AT after 10 retries — "
              "SIM inserted before power? PWRKEY (gpio=%d) wired? "
              "BLDO1 enabled?",
              (int)BOARD_MODEM_PWR_PIN);
        while (true) { delay(1000); }
    }

    gps.begin();
    LOG_I("BOOT", "ready — polling GPS every %lu ms",
          (unsigned long)GPS_READ_INTERVAL_MS);
}

void loop() {
    gps.tick();
    // No `delay()` here on purpose: a future cellular / sleep stage
    // can hook into the same millis-based scheduler.
}
