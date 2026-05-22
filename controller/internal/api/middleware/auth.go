package middleware

// Middleware de autenticação JWT.
//
// Valida o token Bearer em cada request HTTP.
// Tokens são emitidos pelo endpoint POST /api/v1/auth/login.
