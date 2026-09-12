import { auth } from 'express-oauth2-jwt-bearer'

// Verifies the Auth0-issued access token on protected routes and exposes
// the decoded payload as req.auth.payload (req.auth.payload.sub is the
// Auth0 user id - see Usuario."Auth0Sub").
export const checkJwt = auth({
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    audience: process.env.AUTH0_AUDIENCE,
})
