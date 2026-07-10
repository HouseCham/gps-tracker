#include <Arduino.h>
#include <Wire.h>

#define XPOWERS_CHIP_AXP2101
#include <XPowersLib.h>

#include "utilities.h"

// Modem + AT stream logging. TinyGSM 0.12.x dropped its StreamDebugger.h,
// so we ship a 20-line passthrough that prefixes every TX byte and echoes
// every RX byte to Serial. Leave DUMP_AT_COMMANDS on for bring-up.
#define DUMP_AT_COMMANDS

// TINY_GSM_MODEM_SIM7080 / TINY_GSM_RX_BUFFER are set in platformio.ini
// build_flags. Keep them here commented so the sketch is self-documenting.
//   #define TINY_GSM_MODEM_SIM7080
//   #define TINY_GSM_RX_BUFFER 1024
#include <TinyGsmClient.h>

class StreamDebugger : public Stream
{
    Stream &_modem;
    Stream &_debug;
public:
    StreamDebugger(Stream &modem, Stream &debug)
        : _modem(modem), _debug(debug) {}

    int available() override           { return _modem.available(); }
    int peek() override                { return _modem.peek(); }
    int read() override
    {
        int c = _modem.read();
        if (c >= 0) _debug.write(static_cast<uint8_t>(c));
        return c;
    }
    void flush() override              { _modem.flush(); }
    size_t write(uint8_t c) override
    {
        size_t n = _modem.write(c);
        _debug.print(F(">>> "));
        _debug.write(c);
        return n;
    }
    size_t write(const uint8_t *buf, size_t size) override
    {
        size_t n = _modem.write(buf, size);
        _debug.print(F(">>> "));
        _debug.write(buf, size);
        return n;
    }
};

#ifdef DUMP_AT_COMMANDS
StreamDebugger debugger(Serial1, Serial);
TinyGsm        modem(debugger);
#else
TinyGsm        modem(Serial1);
#endif

static XPowersPMU PMU;

static constexpr uint32_t STATUS_LOG_INTERVAL_MS = 10000;
static constexpr uint32_t RAW_DUMP_INTERVAL_MS   = 30000;
static constexpr uint32_t GPS_SETTLE_MS          = 3000;
static constexpr uint8_t  PWRKEY_MAX_ATTEMPTS    = 30;

static uint32_t g_fixCount      = 0;
static uint32_t g_lastStatusMs  = 0;
static uint32_t g_lastRawDumpMs = 0;
static bool     g_blinkLevel    = false;

// ---- pmuBringUp: power on the modem rail + GPS antenna rail ----
static bool pmuBringUp()
{
    Serial.println(F("[pmu] init AXP2101 (I2C 0x34)"));
    if (!PMU.begin(Wire, AXP2101_SLAVE_ADDRESS, I2C_SDA, I2C_SCL)) {
        Serial.println(F("[pmu] FAIL: AXP2101 not detected on Wire"));
        return false;
    }
    Serial.println(F("[pmu] OK"));

    // Cold-boot housekeeping: drop the modem rail so the upcoming PWRKEY
    // pulse starts from a known state. esp_sleep_get_wakeup_cause() ==
    // UNDEFINED means we came up from power-on (not deep-sleep wake).
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED) {
        Serial.println(F("[pmu] cold boot -> disableDC3() before PWRKEY"));
        PMU.disableDC3();
        delay(200);
    }

    // Modem main rail: 3.0V (SIM7080 range 2.7-3.4V).
    Serial.println(F("[pmu] DC3 = 3000 mV (modem rail)"));
    PMU.setDC3Voltage(3000);
    PMU.enableDC3();

    // GPS active antenna rail (BLDO2): 3.3V. Antenna must be powered for
    // the SIM7080 GNSS receiver to see satellites.
    Serial.println(F("[pmu] BLDO2 = 3300 mV (GPS antenna rail)"));
    PMU.setBLDO2Voltage(3300);
    PMU.enableBLDO2();

    // No NTC on this board — leaving TS pin measure enabled would block
    // charging forever.
    Serial.println(F("[pmu] disableTSPinMeasure() (no NTC on board)"));
    PMU.disableTSPinMeasure();

    return true;
}

// ---- modemPwrKeyPulse: toggle BOARD_MODEM_PWR_PIN low->high->low ----
// The SIM7080 PWRKEY pin wants a >1s low pulse to power on.
static void modemPwrKeyPulse()
{
    pinMode(BOARD_MODEM_PWR_PIN, OUTPUT);
    digitalWrite(BOARD_MODEM_PWR_PIN, LOW);
    delay(100);
    digitalWrite(BOARD_MODEM_PWR_PIN, HIGH);
    delay(1000);
    digitalWrite(BOARD_MODEM_PWR_PIN, LOW);
}

// ---- modemBringUp: open Serial1, pulse PWRKEY until AT responds ----
static bool modemBringUp()
{
    Serial.printf("[serial1] begin 115200 8N1 rxd=%d txd=%d\n",
                  BOARD_MODEM_RXD_PIN, BOARD_MODEM_TXD_PIN);
    Serial1.begin(115200, SERIAL_8N1, BOARD_MODEM_RXD_PIN, BOARD_MODEM_TXD_PIN);

    Serial.println(F("[modem] PWRKEY pulse + testAT(1000) until AT responds"));
    for (uint8_t attempt = 1; attempt <= PWRKEY_MAX_ATTEMPTS; ++attempt) {
        modemPwrKeyPulse();
        if (modem.testAT(1000)) {
            Serial.printf("[modem] AT OK on attempt %u\n", attempt);
            Serial.println(F("[modem] AT+CGMR (firmware version) ->"));
            modem.sendAT("+CGMR");
            modem.waitResponse(3000UL);
            return true;
        }
        Serial.printf("[modem] no AT yet (attempt %u/%u)\n",
                      attempt, PWRKEY_MAX_ATTEMPTS);
    }
    Serial.println(F("[modem] FAIL: no AT response after max attempts"));
    return false;
}

// ---- gpsBegin: cold-start the GNSS engine, enable, settle, select constellations ----
static bool gpsBegin()
{
    Serial.println(F("[gps] cycling BLDO2 (GPS antenna rail) for hard GNSS reset"));
    PMU.disableBLDO2(); delay(500);
    PMU.enableBLDO2();  delay(1000);

    Serial.println(F("[gps] AT+CFUN=4 (airplane mode: cellular off, SIM preserved) ->"));
    modem.sendAT("+CFUN=4");
    modem.waitResponse(5000UL);
    delay(2000);  // let modem settle after radio-off

    Serial.println(F("[gps] AT+CGNSCOLD (force GNSS engine cold start) ->"));
    modem.sendAT("+CGNSCOLD");
    if (modem.waitResponse(5000UL) != 1) {
        Serial.println(F("[gps] WARN: no OK from AT+CGNSCOLD, continuing anyway"));
    }

    Serial.println(F("[gps] AT+CGPIO=0,48,1,1 (H606 GPS antenna power on) ->"));
    modem.sendAT("+CGPIO=0,48,1,1");
    modem.waitResponse(2000UL);

    Serial.println(F("[gps] enableGPS()"));
    if (!modem.enableGPS()) {
        Serial.println(F("[gps] FAIL: enableGPS() returned false"));
        return false;
    }
    Serial.println(F("[gps] enableGPS returned OK"));

    // The SIM7080 GNSS task isn't fully alive the moment AT+CGNSPWR=1
    // returns OK — it takes ~2-3s to register and start answering
    // AT+CGNSINF. Querying in that window returns nothing (not even an
    // ERROR), which is what the user was hitting. 3s settle is the
    // community workaround for the same symptom on SIM7000/SIM7080.
    Serial.printf("[gps] settling %lu ms for GNSS engine cold start\n",
                  (unsigned long)GPS_SETTLE_MS);
    delay(GPS_SETTLE_MS);

    Serial.println(F("[gps] AT+CGNSMOD=1,0,1,0,0 (GPS+BeiDou) ->"));
    modem.sendAT("+CGNSMOD=1,0,1,0,0");
    modem.waitResponse(2000UL);

    Serial.println(F("[gps] ready — fix may take minutes outdoors"));
    return true;
}

// ---- readGps: one fix attempt + LED feedback + periodic status / raw dump ----
static void readGps()
{
    float lat = 0, lon = 0, spd = 0, alt = 0, acc = 0;
    int   vsat = 0, usat = 0, yy = 0, mo = 0, dd = 0, hh = 0, mi = 0, ss = 0;

    if (modem.getGPS(&lat, &lon, &spd, &alt, &vsat, &usat, &acc,
                     &yy, &mo, &dd, &hh, &mi, &ss))
    {
        Serial.println();
        Serial.printf("[gps] FIX #%u:\n", (unsigned)++g_fixCount);
        Serial.printf("       lat=%.8f  lon=%.8f\n", (double)lat, (double)lon);
        Serial.printf("       speed=%.2f knots  alt=%.1f m  acc=%.1f m\n",
                      (double)spd, (double)alt, (double)acc);
        Serial.printf("       sats in view=%d  used=%d\n", vsat, usat);
        Serial.printf("       time=%04d-%02d-%02d %02d:%02d:%02d UTC\n",
                      yy, mo, dd, hh, mi, ss);
        Serial.println();

        PMU.setChargingLedMode(XPOWERS_CHG_LED_BLINK_4HZ);
        g_lastStatusMs = millis();
    }
    else
    {
        PMU.setChargingLedMode(g_blinkLevel ? XPOWERS_CHG_LED_ON
                                            : XPOWERS_CHG_LED_OFF);
        g_blinkLevel = !g_blinkLevel;

        if (millis() - g_lastStatusMs > STATUS_LOG_INTERVAL_MS) {
            Serial.println(F("[gps] no fix yet"));
            g_lastStatusMs = millis();
        }

        // Periodic raw dump: show whatever the modem actually returns for
        // AT+CGNSINF (or the absence of it) so we can see WHY getGPS() is
        // failing — silent modem, "no fix" response, or parse error.
        if (millis() - g_lastRawDumpMs > RAW_DUMP_INTERVAL_MS) {
            g_lastRawDumpMs = millis();
            Serial.println(F("[gps] raw: AT+CGNSINF ->"));
            modem.sendAT("+CGNSINF");
            modem.waitResponse(3000UL);
        }
    }
}

void setup()
{
    Serial.begin(115200);
    delay(200);
    Serial.println();
    Serial.println(F("========================================="));
    Serial.println(F(" open-gps-iot: T-SIM7080G bring-up sketch"));
    Serial.println(F("========================================="));
    Serial.printf("free heap: %u bytes\n", (unsigned)ESP.getFreeHeap());
    Serial.printf("wakeup cause: %d "
                  "(0=power-on, >0=deep-sleep wake)\n",
                  (int)esp_sleep_get_wakeup_cause());

    if (!pmuBringUp()) {
        Serial.println(F("HALT: PMU not responding — check I2C wiring"));
        while (1) delay(1000);
    }

    if (!modemBringUp()) {
        Serial.println(F("HALT: modem not responding to AT"));
        while (1) delay(1000);
    }

    if (!gpsBegin()) {
        Serial.println(F("HALT: GPS enable failed"));
        while (1) delay(1000);
    }

    Serial.println(F("[setup] done — entering loop()"));
}

void loop()
{
    readGps();
    delay(1000);
}