# DATAKOMEZA Architecture

## System Overview

DATAKOMEZA is built as a three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│              Next.js + React (Port 3000)                    │
│  • User Interface                                           │
│  • Admin Dashboard                                          │
│  • QR Code Generation                                       │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                       Backend Layer                          │
│              Node.js + Express (Port 5000)                  │
│  • RESTful API                                              │
│  • Authentication & Authorization                           │
│  • Business Logic                                           │
│  • MOSIP Integration                                        │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                         │
│                    PostgreSQL 14+                           │
│  • User Data (Encrypted)                                    │
│  • Consent Records                                          │
│  • Audit Logs                                               │
│  • Service Providers                                        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: CSS Modules with custom design system
- **State Management**: React Context API
- **HTTP Client**: Axios
- **QR Code**: qrcode.react
- **Icons**: react-icons

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Encryption**: AES-256-GCM
- **Validation**: express-validator
- **Security**: helmet, cors, bcrypt

### Database
- **DBMS**: PostgreSQL 14+
- **Connection**: pg (node-postgres)
- **Encryption**: At-rest encryption for sensitive data

## Core Modules

### 1. Authentication Module
**Location**: `backend/src/routes/auth.js`

Handles user and admin authentication:
- User registration with PIN
- User login (email/phone + PIN)
- Admin login (email + password)
- JWT token generation and validation

### 2. User Management Module
**Location**: `backend/src/routes/users.js`

Manages user profiles and attributes:
- Profile CRUD operations
- Encrypted attribute storage
- QR code generation for offline auth

### 3. Consent Management Module
**Location**: `backend/src/routes/consent.js`

Implements privacy-by-design consent system:
- Grant consent to service providers
- Revoke consent
- Track consent history
- Attribute-level permissions

### 4. Verification Module
**Location**: `backend/src/routes/verification.js`

Enables offline authentication:
- QR code verification
- PIN verification
- Cryptographic token validation

### 5. Admin Module
**Location**: `backend/src/routes/admin.js`

Administrative functions:
- User management
- Platform statistics
- Audit log viewing
- Service provider management

### 6. MOSIP Integration Module
**Location**: `backend/src/routes/mosip.js`

Integrates with MOSIP identity platform:
- User registration with MOSIP
- Identity verification
- Biometric data handling (mock)

## Security Architecture

### Data Encryption

1. **At-Rest Encryption**
   - User attributes encrypted with AES-256-GCM
   - Each user has unique encryption key
   - Keys stored separately from data

2. **In-Transit Encryption**
   - HTTPS for all communications
   - JWT tokens for authentication
   - Secure cookie handling

### Authentication Flow

```
User Login:
1. User enters email/phone + PIN
2. Backend validates credentials
3. PIN verified with bcrypt hash
4. JWT token generated and returned
5. Token stored in localStorage
6. Token sent with each API request

Admin Login:
1. Admin enters email + password
2. Backend validates credentials
3. Password verified with bcrypt hash
4. JWT token with admin role generated
5. Token includes role information
```

### Consent Management

```
Consent Grant Flow:
1. User selects service provider
2. User chooses attributes to share
3. User specifies purpose
4. Consent record created
5. Audit log entry created
6. Service provider can access shared attributes

Consent Revoke Flow:
1. User selects consent to revoke
2. Consent marked as revoked
3. Service provider access terminated
4. Audit log entry created
```

## Database Schema

### Key Tables

1. **users** - Refugee user accounts
2. **user_attributes** - Encrypted user data
3. **service_providers** - NGOs and service organizations
4. **admin_users** - Administrative accounts
5. **consent_records** - Data sharing permissions
6. **authentication_logs** - Login attempts and verifications
7. **audit_logs** - Complete activity trail
8. **verification_tokens** - QR codes and offline tokens

### Relationships

```
users (1) ──→ (N) user_attributes
users (1) ──→ (N) consent_records
users (1) ──→ (N) authentication_logs
users (1) ──→ (N) verification_tokens

service_providers (1) ──→ (N) consent_records
service_providers (1) ──→ (N) admin_users
```

## API Architecture

### RESTful Endpoints

All endpoints follow REST conventions:

- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update resources
- `DELETE` - Remove resources

### Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Handling

Centralized error handling with:
- Appropriate HTTP status codes
- Descriptive error messages
- Stack traces in development
- Logged errors for debugging

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- JWT tokens (no session storage)
- Database connection pooling
- Load balancer ready

### Performance Optimization
- Database indexes on frequently queried fields
- Pagination for large datasets
- Efficient SQL queries
- Caching opportunities (Redis)

### Future Enhancements
- Microservices architecture
- Message queue for async operations
- CDN for static assets
- Database replication

## Deployment Architecture

### Development
```
localhost:3000 (Frontend)
localhost:5000 (Backend)
localhost:5432 (PostgreSQL)
```

### Production
```
Frontend: Vercel/Netlify
Backend: AWS EC2/Heroku
Database: AWS RDS/Heroku Postgres
CDN: CloudFront
```

## Monitoring & Logging

### Application Logs
- Location: `backend/logs/`
- Levels: error, warn, info, debug
- Rotation: Daily

### Audit Logs
- Stored in database
- Immutable records
- Compliance ready

### Metrics
- User registrations
- Authentication attempts
- Consent grants/revokes
- API response times

---

For implementation details, see the source code and inline documentation.
