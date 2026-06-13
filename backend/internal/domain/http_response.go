package domain

// HTTPResponse is a generic envelope for all HTTP responses in the API.
// It promotes consistency across success, validation, and error responses.
type HTTPResponse[T any] struct {
	StatusCode int    `json:"status_code"`
	Message    string `json:"message"`
	Data       T      `json:"data"`
}
