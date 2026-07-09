#include <Arduino.h>

void setup() {
    Serial.begin(115200);
    Serial.println("Hello, World!");
}

void loop() {
    Serial.printf("tick %u\n", millis() / 1000);
    delay(1000);
}