package middleware

const (
	// LocalsKeyRequestID stores the request ID.
	LocalsKeyRequestID = "request_id"
	// LocalsKeyClaims stores the Authula actor after AuthSession middleware.
	LocalsKeyClaims = "claims"
	// LocalsKeyUser stores the authenticated *domain.User after user-attach middleware.
	LocalsKeyUser = "user"
	// LocalsKeyDeviceID stores the authenticated deviceID after device-auth middleware.
	LocalsKeyDeviceID = "device_id"
	// LocalsKeyValidatedBody stores the validated request body after ValidateRequestBody middleware.
	LocalsKeyValidatedBody = "validated_body"
)
