package httptest

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
)

func (ta *TestApp) Request(method, path string, token string, body interface{}) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewReader(b)
	}

	req := httptest.NewRequest(method, path, reqBody)
	req.Header.Set("Content-Type", "application/json")

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := ta.App.Test(req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}

func (ta *TestApp) RequestWithHeaders(method, path, token string, body interface{}, headers map[string]string) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewReader(b)
	}

	req := httptest.NewRequest(method, path, reqBody)
	req.Header.Set("Content-Type", "application/json")

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := ta.App.Test(req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}

type HTTPResponse struct {
	StatusCode int             `json:"status_code"`
	Message    string          `json:"message"`
	Data       json.RawMessage `json:"data,omitempty"`
}

func ParseResponse(resp *http.Response) (*HTTPResponse, error) {
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var result HTTPResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func ParseResponseBody(resp *http.Response) ([]byte, error) {
	return io.ReadAll(resp.Body)
}

func ParseResponseData[T any](resp *http.Response) (*T, error) {
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var result HTTPResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	if result.Data == nil {
		return nil, nil
	}
	var data T
	if err := json.Unmarshal(result.Data, &data); err != nil {
		return nil, err
	}
	return &data, nil
}

func (ta *TestApp) MustRequest(method, path string, token string, body interface{}) *http.Response {
	resp, err := ta.Request(method, path, token, body)
	if err != nil {
		panic(err)
	}
	return resp
}



func GetStatusCode(resp *http.Response) int {
	return resp.StatusCode
}

func GetMessage(resp *http.Response) string {
	body, _ := io.ReadAll(resp.Body)
	var r HTTPResponse
	json.Unmarshal(body, &r)
	return r.Message
}