#include <Arduino.h>
#include <esp_task_wdt.h>

#include "gps_board.h"
#include "config.h"
#include "secrets.h"

static GpsBoard board;
static Secrets  secrets;

void setup() {
    Serial.begin(115200);
    delay(300);

    esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
    esp_task_wdt_add(NULL);

    if (!board.begin()) {
        Serial.println(F("[HALT] bring-up failed; rebooting in 5 s"));
        delay(5000);
        ESP.restart();
    }

    if (!secrets_load(secrets)) {
        Serial.println(F("[ERR ] secrets missing — copy config/secrets.example.h to config/secrets.h and fill uuid + api_key"));
        Serial.println(F("[HALT] rebooting in 5 s"));
        delay(5000);
        ESP.restart();
    }
    secrets_print_diag(secrets);
}

void loop() {
    esp_task_wdt_reset();

    static unsigned long lastPoll = 0;
    static unsigned long lastIdle = 0;
    const unsigned long now = millis();

    if (now - lastPoll < FIX_POLL_MS) return;
    lastPoll = now;

    float lat = 0.0f, lon = 0.0f, alt = 0.0f;
    if (board.pollFix(lat, lon, alt)) {
        lastIdle = 0;  // reset idle cadence so a lost-fix banner fires quickly
        Serial.printf("[FIX ] sats=%lu  lat=%.6f  lon=%.6f  alt=%.1fm\n",
                      (unsigned long)board.satellitesUsed(), lat, lon, alt);
        return;
    }

    // No fix: surface the raw +CGNSINF line so we can see whether the
    // receiver is running, has sats in view, or is dead. First field after
    // the prefix is run_status (1=running), second is fix_status (1=locked).
    if (now - lastIdle >= 10000) {
        lastIdle = now;
        String s = board.rawGnssState();
        if (s.length() == 0) {
            Serial.println(F("[....] modem returned no +CGNSINF"));
        } else {
            Serial.print(F("[STAT] ")); Serial.println(s);
        }
    }
}
