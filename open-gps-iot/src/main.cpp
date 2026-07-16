#include <Arduino.h>
#include <esp_task_wdt.h>

#include "gps_board.h"
#include "location_payload.h"
#include "transport.h"
#include "config.h"
#include "secrets.h"

static GpsBoard board;
static Secrets  secrets;
static bool     wifi_up = false;

void setup() {
    Serial.begin(115200);
    // Head-start delay so an operator can press RST and still have time
    // to attach a serial monitor before the boot logs scroll past. The
    // ESP32-S3 USB-CDC port also re-enumerates on reset, which most
    // monitors handle by dropping the connection; this delay gives the
    // host a moment to re-establish before setup() emits anything.
    delay(3000);
    Serial.println(F("\n[BOOT] T-SIM7080G-S3 GPS bring-up"));
    Serial.flush();

    esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
    esp_task_wdt_add(NULL);

    if (!board.begin()) {
        Serial.println(F("[HALT] bring-up failed; rebooting in 5 s"));
        Serial.flush();
        delay(5000);
        ESP.restart();
    }
    Serial.flush();

    if (!secrets_load(secrets)) {
        Serial.println(F("[ERR ] secrets missing — copy config/secrets.example.h to config/secrets.h and fill uuid + api_key"));
        Serial.println(F("[HALT] rebooting in 5 s"));
        Serial.flush();
        delay(5000);
        ESP.restart();
    }
    secrets_print_diag(secrets);
    Serial.flush();

    wifi_up = transport_begin(secrets);
    Serial.flush();
}

void loop() {
    esp_task_wdt_reset();

    static unsigned long lastPoll = 0;
    static unsigned long lastIdle = 0;
    static unsigned long lastUpload = 0;
    static LocationPayload lastFix = {};
    static bool hasFix = false;

    const unsigned long now = millis();

    if (now - lastPoll >= FIX_POLL_MS) {
        lastPoll = now;
        if (board.pollFixPayload(lastFix)) {
            hasFix = true;
            Serial.printf("[FIX ] sats=%lu  lat=%.6f  lon=%.6f  alt=%.1fm\n",
                          (unsigned long)board.satellitesUsed(),
                          lastFix.latitude, lastFix.longitude, lastFix.altitude);
        } else if (now - lastIdle >= 10000) {
            lastIdle = now;
            String s = board.rawGnssState();
            if (s.length() == 0) {
                Serial.println(F("[....] modem returned no +CGNSINF"));
            } else {
                Serial.print(F("[STAT] ")); Serial.println(s);
            }
        }
    }

    if (!wifi_up || !hasFix) return;
    if (now - lastUpload < UPLOAD_PERIOD_S * 1000UL) return;
    lastUpload = now;

    if (transport_post_locations(lastFix, secrets)) {
        Serial.println(F("[UP  ] location sent"));
    } else {
        Serial.println(F("[ERR ] upload failed; next cycle will retry"));
    }
}