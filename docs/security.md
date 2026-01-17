# DATAKOMEZA Security Model

## Overview

DATAKOMEZA implements a comprehensive security model based on privacy-by-design principles, ensuring refugee data is protected at all levels.

## Security Principles

### 1. Privacy by Design
- Minimal data collection
- Purpose limitation
- Data minimization
- User control over data

### 2. Defense in Depth
- Multiple layers of security
- Encryption at rest and in transit
- Authentication and authorization
- Audit logging

### 3. Zero Trust
- Verify every request
- Least privilege access
- Continuous monitoring

## Data Protection

### Encryption at Rest

**User Attributes:**
- Algorithm: AES-256-GCM
- Each user has unique encryption key
- Keys stored separately from encrypted data
- Authenticated encryption prevents tampering

**Implementation:**
```javascript
// Encryption
const encrypted = encrypt(plaintext);
// Format: IV:ciphertext:authTag

// Decryption
const plaintext = decrypt(encrypted);
```

### Encryption in Transit

- **HTTPS Only**: All communications over TLS 1.3
- **Certificate Pinning**: Prevents MITM attacks
- **Secure Headers**: helmet.js configuration

### Password Security

**User PINs:**
- 6-digit numeric PIN
- Hashed with bcrypt (10 rounds)
- Never stored in plaintext
- Rate limiting on login attempts

**Admin Passwords:**
- Minimum 8 characters
- Complexity requirements
- Hashed with bcrypt (10 rounds)
- Password reset via secure token

## Authentication & Authorization

### JWT Tokens

**Structure:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "type": "user|admin",
  "role": "admin|super_admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Security Features:**
- Short expiration (7 days default)
- Signed with secret key
- Validated on every request
- Stored in localStorage (frontend)

### Role-Based Access Control (RBAC)

**Roles:**
1. **User** - Refugee/asylum seeker
   - Manage own profile
   - Grant/revoke consents
   - Generate QR codes

2. **Admin** - Service provider admin
   - View users
   - View audit logs
   - View statistics

3. **Super Admin** - Platform administrator
   - All admin permissions
   - Manage service providers
   - System configuration

### Authorization Flow

```
Request → JWT Validation → Role Check → Resource Access
```

## Consent Management

### Granular Consent

Users control:
- Which attributes to share
- With which service providers
- For what purpose
- For how long

### Consent Lifecycle

1. **Grant**: User explicitly grants consent
2. **Active**: Consent is valid and not expired
3. **Expired**: Consent past expiry date
4. **Revoked**: User revokes consent

### Audit Trail

Every consent action logged:
- Who granted/revoked
- What data was shared
- When action occurred
- Why (purpose)

## Offline Authentication

### QR Code Security

**Generation:**
1. Create cryptographic token
2. Store hash in database
3. Embed in QR code with expiry
4. Sign QR data

**Verification:**
1. Scan QR code
2. Extract token and user ID
3. Verify token hash
4. Check expiry
5. Mark token as used

**Security Features:**
- One-time use tokens
- 24-hour expiry
- Cryptographically secure random tokens
- Cannot be forged

### PIN Verification

**Offline Mode:**
- PIN verified against local hash
- No network required
- Logged for audit

## Audit Logging

### What is Logged

- User registrations
- Login attempts (success/failure)
- Consent grants/revokes
- Profile updates
- Admin actions
- Data access

### Log Format

```json
{
  "id": "uuid",
  "userId": "uuid",
  "action": "user_registered",
  "resourceType": "user",
  "resourceId": "uuid",
  "details": {...},
  "ipAddress": "192.168.1.1",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Log Retention

- Stored in database
- Immutable records
- Retained for compliance
- Regular backups

## API Security

### Input Validation

- express-validator for all inputs
- Type checking
- Format validation
- Sanitization

### Rate Limiting

- 100 requests per 15 minutes
- Per IP address
- Prevents brute force attacks

### CORS Configuration

```javascript
{
  origin: process.env.CORS_ORIGIN,
  credentials: true
}
```

### Security Headers

Using helmet.js:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy

## Database Security

### Connection Security

- Connection pooling
- Prepared statements (prevents SQL injection)
- Least privilege database user
- SSL/TLS connections

### Data Integrity

- Foreign key constraints
- Check constraints
- Unique constraints
- Triggers for updated_at

### Backup & Recovery

- Regular automated backups
- Point-in-time recovery
- Encrypted backups
- Tested restore procedures

## Vulnerability Prevention

### SQL Injection
- Parameterized queries
- Input validation
- ORM/query builder

### XSS (Cross-Site Scripting)
- Input sanitization
- Output encoding
- Content Security Policy

### CSRF (Cross-Site Request Forgery)
- SameSite cookies
- CSRF tokens
- Origin validation

### Session Hijacking
- Secure token storage
- Short token expiry
- Token rotation

## Compliance

### GDPR Compliance

- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Consent management

### Data Protection

- Data minimization
- Purpose limitation
- Storage limitation
- Integrity and confidentiality

## Security Best Practices

### Development

1. **Never commit secrets**
   - Use .env files
   - Add .env to .gitignore
   - Use environment variables

2. **Keep dependencies updated**
   - Regular npm audit
   - Update vulnerable packages
   - Monitor security advisories

3. **Code review**
   - Peer review all changes
   - Security-focused reviews
   - Automated security scanning

### Production

1. **Environment Configuration**
   - Change all default secrets
   - Use strong encryption keys
   - Enable HTTPS only

2. **Monitoring**
   - Log all security events
   - Monitor for anomalies
   - Set up alerts

3. **Incident Response**
   - Have a response plan
   - Regular security drills
   - Contact procedures

## Security Checklist

### Pre-Deployment

- [ ] All secrets changed from defaults
- [ ] HTTPS enabled
- [ ] Database encrypted
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] Dependencies updated
- [ ] Security audit completed

### Regular Maintenance

- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly penetration testing
- [ ] Review audit logs
- [ ] Update documentation

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: security@datakomeza.org
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours.

---

**Security is everyone's responsibility. Stay vigilant!**
