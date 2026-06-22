Login Implementation Plan
Step 1: Configure better-auth client
File: src/lib/auth/client.ts
Currently empty. We need to set up the auth client with the backend adapter:
- Use @better-fetch/fetch (already in package.json) as the fetcher
- Point to POST /api/auth/email-password/sign-in
- Configure the client to store tokens (access + refresh)
Decision needed: How should tokens be stored?
- Option A: HTTP-only cookies (more secure, handled by the client)
- Option B: Memory + localStorage for refresh token
- Option C: Use Authula's session cookie approach
Step 2: Create auth types
File: src/lib/auth/types.ts (new)
Define TypeScript interfaces for:
- SignInCredentials (email, password)
- AuthResponse (user + tokens from Authula)
- User (aligned with what the backend returns after LazyUser)
Step 3: Create auth store (nano stores)
File: src/lib/stores/auth.ts (new)
Build reactive state:
- $user - atom holding the current user or null
- $isAuthenticated - computed boolean
- $isLoading - for async operations
This allows any island to react to auth state changes.
Step 4: Create auth service
File: src/lib/auth/service.ts (new)
Create authService with methods:
- signIn(email, password) - calls /api/auth/email-password/sign-in, stores tokens, fetches user
- signOut() - clears tokens and user state
- getSession() - restores session on page load (checks for valid token)
Step 5: Wire LoginForm to auth service
Files:
- src/components/react/auth/LoginForm.tsx
- src/pages/login.astro
Replace the alert() stub with actual authService.signIn() call, handle loading/error states, and redirect to a dashboard or home page on success.
Step 6: Session persistence on page load
File: src/layouts/BaseLayout.astro or a dedicated auth init module
On app initialization, call authService.getSession() to check for existing valid token and hydrate the store before rendering protected content.
Step 7: Add auth guard to protected routes
Files: src/middleware/auth.ts (new)
Protect pages like /dashboard:
- If not authenticated, redirect to /login
- If authenticated but mustChangePassword === true, redirect to /change-password
Step 8: Handle sign-up flow
Files:
- src/components/react/auth/SignupForm.tsx
- src/pages/signup.astro
Mirror the login implementation for authService.signUp() calling /api/auth/email-password/sign-up.