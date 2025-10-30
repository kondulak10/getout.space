# Security Documentation

## 🔐 Overview

This application implements multiple layers of security to protect user data and prevent unauthorized access.

## Critical Security Measures Implemented

### 1. Token Encryption at Rest (AES-256-GCM)

**What:** All Strava OAuth tokens (access tokens and refresh tokens) are encrypted before being stored in MongoDB.

**Why:** If the database is compromised, attackers cannot use the stolen tokens to access users' Strava accounts.

**How it works:**
- Uses AES-256-GCM authenticated encryption
- Each token has a unique IV (Initialization Vector) - never reused
- Authentication tag ensures data hasn't been tampered with
- Automatic encryption/decryption via Mongoose middleware

**Location:** `src/utils/encryption.ts`, `src/models/User.ts`

**Key requirement:** `ENCRYPTION_KEY` must be a 64-character hex string (32 bytes)

### 2. JWT Authentication

**What:** JSON Web Tokens are used for API authentication.

**Why:** Stateless authentication that scales well and works across services.

**Security features:**
- 7-day token expiration
- Tokens include user ID, Strava ID, and admin status
- Backend validates every request

**Location:** `src/utils/jwt.ts`, `src/middleware/auth.ts`

**Key requirement:** `JWT_SECRET` must be a secure random string

### 3. Fail-Fast Security Validation

**What:** Application refuses to start if critical security keys are missing.

**Why:** Prevents accidentally running in production without proper security.

**Checks:**
- `JWT_SECRET` must be set (no default fallback)
- `ENCRYPTION_KEY` must be set and exactly 64 hex characters
- Application exits immediately with clear error messages

### 4. Role-Based Access Control (RBAC)

**What:** Admin-only routes and GraphQL queries.

**Features:**
- First user automatically becomes admin
- GraphQL queries protected with `requireAuth()` and `requireAdmin()`
- Frontend route guards prevent unauthorized page access

**Protected resources:**
- `/users` page - Admin only
- GraphQL `users` query - Admin only
- GraphQL `deleteUser` mutation - Admin only

### 5. GraphQL Security

**What:** All sensitive queries require authentication and authorization.

**Implementation:**
- Context includes authenticated user from JWT
- Helper functions `requireAuth()` and `requireAdmin()`
- Returns proper error codes (UNAUTHENTICATED, FORBIDDEN)

## 🔑 Environment Variables

### Required Security Keys

```bash
# Generate with: node scripts/generate-keys.js
JWT_SECRET=<64-char-hex-string>
ENCRYPTION_KEY=<64-char-hex-string>
```

### Strava OAuth

```bash
STRAVA_CLIENT_ID=<your-strava-client-id>
STRAVA_CLIENT_SECRET=<your-strava-client-secret>
```

### Database

```bash
MONGODB_URI=<your-mongodb-connection-string>
```

## 🚀 Setup Instructions

### 1. Generate Security Keys

```bash
cd backend
node scripts/generate-keys.js
```

Copy the output to your `.env` file.

### 2. Verify Configuration

Start the backend:
```bash
npm run dev
```

If keys are missing or invalid, the application will exit with error messages.

## 🔒 Best Practices

### Development

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use different keys** for development vs production
3. **Rotate keys** if you suspect compromise
4. **Test token encryption** with dummy data first

### Production

1. **Store keys securely:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Environment variables in hosting platform

2. **Monitor for security issues:**
   - Failed authentication attempts
   - Unusual token refresh patterns
   - Database access patterns

3. **Regular security audits:**
   - Review access logs
   - Update dependencies (`npm audit`)
   - Rotate keys periodically

## 🚨 Security Incident Response

### If JWT_SECRET is Compromised

1. Generate new `JWT_SECRET`
2. Restart application
3. All users will need to re-login (tokens are invalidated)

### If ENCRYPTION_KEY is Compromised

⚠️ **CRITICAL:** You cannot decrypt existing tokens with a new key!

1. Generate new `ENCRYPTION_KEY`
2. Restart application
3. **All existing users must re-authenticate with Strava**
4. Consider notifying users of security incident

### If Database is Compromised

1. Tokens are encrypted - attackers cannot use them directly
2. Still take action:
   - Rotate `ENCRYPTION_KEY` immediately
   - Force all users to re-authenticate
   - Review access logs
   - Notify affected users

## 📊 Security Audit Checklist

- [ ] All security keys are set in environment variables
- [ ] No hardcoded secrets in source code
- [ ] `.env` file is in `.gitignore`
- [ ] Different keys for development and production
- [ ] Keys stored securely in production (not in plain text)
- [ ] Regular dependency updates (`npm audit fix`)
- [ ] HTTPS enabled in production
- [ ] Database access restricted (IP whitelist, VPC)
- [ ] Monitoring and logging enabled
- [ ] Backup and recovery plan tested

## 🔗 Related Files

- `src/utils/encryption.ts` - Token encryption/decryption
- `src/utils/jwt.ts` - JWT generation and validation
- `src/middleware/auth.ts` - Authentication middleware
- `src/models/User.ts` - User model with encryption hooks
- `scripts/generate-keys.js` - Key generation script

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
