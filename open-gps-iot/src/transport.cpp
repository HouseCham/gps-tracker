#include "transport.h"

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

#include "config.h"
#include "location_payload.h"
#include "secrets.h"  // full definitions; transport.h uses forward decls to
                       // avoid pulling <Arduino.h> into native test builds

bool transport_begin(const Secrets& s) {
    if (s.wifi_ssid == nullptr || s.wifi_ssid[0] == '\0') {
        Serial.println(F("[WIFI] no SSID configured — uploads disabled"));
        return false;
    }

    Serial.printf("[WIFI] connecting to %s ...\n", s.wifi_ssid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(s.wifi_ssid, s.wifi_password);

    const unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - start >= WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println(F("[ERR ] WiFi connect timed out"));
            WiFi.disconnect(true);
            return false;
        }
        delay(250);
    }
    Serial.printf("[OK  ] WiFi connected, IP=%s RSSI=%d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    return true;
}

static bool post_once(const char* url, const char* api_key,
                      const char* json_body) {
    WiFiClientSecure client;
    client.setCACert(NULL);  // ponytail: stage 3 dev — use system CA bundle
                              // via the framework default (no setInsecure()).
                              // If gps-tracker.local has no public cert,
                              // we'll see HTTPC_ERROR_CONNECTION_REFUSED
                              // and switch to setInsecure() then.

    HTTPClient http;
    http.begin(client, url);

    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-API-Key", api_key);
    http.setTimeout(5000);

    const int code = http.POST((uint8_t*)json_body, strlen(json_body));

    bool ok = (code == 201);
    if (ok) {
        Serial.printf("[POST] 201 OK (%u bytes)\n",
                      (unsigned)http.getSize());
    } else if (code > 0) {
        // HTTP responded but with an error status. Read the body for context.
        String body = http.getString();
        Serial.printf("[ERR ] HTTP %d: %s\n", code, body.c_str());
    } else {
        // code < 0: transport-level failure (DNS, TLS, connection refused).
        Serial.printf("[ERR ] HTTP transport failure (code=%d)\n", code);
    }

    http.end();
    return ok;
}

bool transport_post_locations(const LocationPayload& p, const Secrets& s) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println(F("[ERR ] WiFi not connected; skipping upload"));
        return false;
    }

    char url[256];
    if (transport_build_url(API_HOST, 0, s.uuid,
                            url, sizeof(url)) == 0) {
        Serial.println(F("[ERR ] URL overflow"));
        return false;
    }

    char body[256];
    const size_t bn = location_payload_to_json(p, body, sizeof(body));
    if (bn == 0) {
        Serial.println(F("[ERR ] JSON overflow"));
        return false;
    }

    Serial.printf("[POST] -> %s\n", url);
    if (post_once(url, s.api_key, body)) return true;

    Serial.printf("[RETRY] backing off %u ms\n",
                  (unsigned)UPLOAD_RETRY_DELAY_MS);
    delay(UPLOAD_RETRY_DELAY_MS);
    return post_once(url, s.api_key, body);
}