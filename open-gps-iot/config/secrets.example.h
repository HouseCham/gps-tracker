#pragma once

// Device identity — replace with values from the dashboard after creating the device.
constexpr const char* DEVICE_UUID_FIRMWARE = "";  // e.g. "aaaaaaaa-bbbb-cccc-dddd-000000000001"
constexpr const char* DEVICE_API_KEY = "";         // 43-char base64url token from POST /api/v1/devices/:id/api-keys

// Fill both values, then rename this file to secrets.h (it is gitignored).
// Leave either empty to trigger a boot error with instructions.
