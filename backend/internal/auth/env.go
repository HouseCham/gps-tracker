package auth

import "os"

// setEnvIfEmpty sets an env var only when it is not already set. We
// use this to make the connection-string plumbing between our
// config layer and Authula's internal bootstrap explicit without
// silently overwriting a value the operator may have provided
// directly.
func setEnvIfEmpty(key, value string) error {
	if _, ok := os.LookupEnv(key); ok {
		return nil
	}
	return os.Setenv(key, value)
}
