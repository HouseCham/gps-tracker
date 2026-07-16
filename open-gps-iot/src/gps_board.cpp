#include "gps_board.h"

#include <Arduino.h>
#include <esp_sleep.h>

#include "utilities.h"

#define XPOWERS_CHIP_AXP2101
#include "XPowersLib.h"

#include <TinyGsmClient.h>

static XPowersPMU PMU;

#ifdef DUMP_AT_COMMANDS
#include <StreamDebugger.h>
static StreamDebugger s_modemDbg(Serial1, Serial);
static TinyGsm modem(s_modemDbg);  // every modem byte echoed to USB-CDC
#else
static TinyGsm modem(Serial1);
#endif

// Debug-mode logging per project request: every important action (setup
// step, AT handshake, GNSS enable, fix / no-fix) prints a tagged line.
// Named LOG (not DBG) to avoid colliding with TinyGSM's internal DBG macro.
#define LOG(msg) do { Serial.print(F(msg "\n")); } while (0)

// ----- PMU prologue --------------------------------------------------------
// Canonical sequence from ATDebug.ino:36-95. Disable unused rails for low
// quiescent draw, then raise the three rails the modem path needs.
static bool pmuInit() {
    if (!PMU.begin(Wire, AXP2101_SLAVE_ADDRESS, I2C_SDA, I2C_SCL)) {
        Serial.println(F("[ERR] PMU begin failed"));
        return false;
    }
    Serial.println(F("[OK ] PMU online (AXP2101 @ 0x34)"));

    PMU.disableDC2(); PMU.disableDC4(); PMU.disableDC5();
    PMU.disableALDO1(); PMU.disableALDO2(); PMU.disableALDO3(); PMU.disableALDO4();
    PMU.disableBLDO2(); PMU.disableCPUSLDO(); PMU.disableDLDO1(); PMU.disableDLDO2();

    // Cold-boot only: force a clean DC3 cycle so the modem starts from off.
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED) {
        PMU.disableDC3();
        delay(200);
    }

    PMU.setBLDO1Voltage(3300); PMU.enableBLDO1();  // ESP32 <-> modem UART level shifter
    PMU.setDC3Voltage(3000);   PMU.enableDC3();    // modem main rail (2700-3400 mV allowed)
    PMU.setBLDO2Voltage(3300); PMU.enableBLDO2();  // GPS antenna LNA power
    // H606 has no NTC thermistor on TS pin -> AXP2101 refuses to charge.
    PMU.disableTSPinMeasure();

    Serial.println(F("[OK ] PMU rails up: BLDO1=3.3V (UART), DC3=3.0V (modem), BLDO2=3.3V (GPS ant)"));
    return true;
}

// PWRKEY pulse per ATDebug.ino:99-114: LOW 100ms, HIGH 1000ms, LOW.
static void modemPwrOn() {
    pinMode(BOARD_MODEM_PWR_PIN, OUTPUT);
    digitalWrite(BOARD_MODEM_PWR_PIN, LOW);  delay(100);
    digitalWrite(BOARD_MODEM_PWR_PIN, HIGH); delay(1000);
    digitalWrite(BOARD_MODEM_PWR_PIN, LOW);
}

bool GpsBoard::begin() {
    Serial.begin(115200);
    delay(300);
    Serial.println(F("\n[BOOT] T-SIM7080G-S3 GPS bring-up"));

    if (!pmuInit()) return false;

    Serial.println(F("[STEP] UART1 (RX=4, TX=5) @ 115200"));
    Serial1.begin(115200, SERIAL_8N1, BOARD_MODEM_RXD_PIN, BOARD_MODEM_TXD_PIN);

    Serial.println(F("[STEP] PWRKEY pulse"));
    modemPwrOn();

    Serial.println(F("[STEP] Waiting for modem AT (up to 15 s)"));
    int tries;
    for (tries = 1; tries <= 15; ++tries) {
        if (modem.testAT(1000)) break;
        Serial.printf("[... ] AT retry %d/15\n", tries);
    }
    if (tries > 15) {
        Serial.println(F("[ERR] modem did not respond to AT"));
        return false;
    }
    Serial.println(F("[OK ] modem AT responsive"));

    Serial.println(F("[STEP] Enabling GNSS receiver"));
    modem.enableGPS();
    Serial.println(F("[OK ] GNSS on; first fix may take minutes outdoors"));
    return true;
}

bool GpsBoard::pollFix(float &lat, float &lon, float &alt) {
    float spd = 0.0f, acc = 0.0f;
    int vsat = 0, usat = 0;
    int yy = 0, mo = 0, dd = 0, hh = 0, mi = 0, ss = 0;

    if (!modem.getGPS(&lat, &lon, &spd, &alt,
                      &vsat, &usat, &acc,
                      &yy, &mo, &dd, &hh, &mi, &ss)) {
        _vsat = 0;
        _usat = 0;
        return false;
    }
    _vsat = static_cast<uint32_t>(vsat);
    _usat = static_cast<uint32_t>(usat);
    return true;
}

String GpsBoard::rawGnssState() {
    return modem.getGPSraw();
}

bool GpsBoard::pollFixPayload(LocationPayload& out) {
    // Zero the payload first so a failed poll leaves it cleanly empty
    // (no stale lat/lon from a previous fix leaking through).
    memset(&out, 0, sizeof(out));

    float lat = 0, lon = 0, spd = 0, alt = 0, acc = 0;
    int   vsat = 0, usat = 0;
    int   yy = 0, mo = 0, dd = 0, hh = 0, mi = 0, ss = 0;

    if (!modem.getGPS(&lat, &lon, &spd, &alt,
                      &vsat, &usat, &acc,
                      &yy, &mo, &dd, &hh, &mi, &ss)) {
        _vsat = 0;
        _usat = 0;
        return false;
    }
    _vsat = static_cast<uint32_t>(vsat);
    _usat = static_cast<uint32_t>(usat);

    location_payload_from_fix(out,
        lat, lon, spd, alt, usat, acc,
        yy, mo, dd, hh, mi, ss);
    return true;
}
