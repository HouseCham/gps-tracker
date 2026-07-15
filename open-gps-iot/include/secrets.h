#pragma once

#include <Arduino.h>

// Device identity loaded from config/secrets.h at boot. Both fields are
// required — empty strings trigger a loud error + reboot with backoff
// so the device never silently POSTs as "no identity".
struct Secrets {
    const char* uuid;          // e.g. "aaaaaaaa-bbbb-cccc-dddd-000000000001"
    const char* api_key;       // 43-char base64url token from POST /api/v1/devices/:id/api-keys
};

// Loads the secrets defined in config/secrets.h. Returns true on success;
// false if either field is missing or empty (caller should log + reboot).
//
// Call once from setup() — the pointers stay valid for the lifetime of
// the firmware (they point into the .rodata of config/secrets.h).
bool secrets_load(Secrets& out);

// Prints a masked config summary: host, uuid length, key length and a
// key-prefix-suffix mask. Safe to leave on in production logs.
void secrets_print_diag(const Secrets& s);