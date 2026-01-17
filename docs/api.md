# DATAKOMEZA API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+250788123456",
  "pin": "123456",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "nationality": "Rwanda"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "mosipId": "MOSIP1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token"
  }
}
```

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "pin": "123456"
}
```

#### Admin Login
```http
POST /auth/admin/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### User Profile

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "mosipId": "MOSIP1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "nationality": "Rwanda",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "phone": "+250788999888",
  "photoUrl": "https://example.com/photo.jpg"
}
```

#### Get User Attributes
```http
GET /users/attributes
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "refugee_status",
      "value": "refugee",
      "type": "text",
      "isSensitive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Add User Attribute
```http
POST /users/attributes
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "education_level",
  "value": "University",
  "type": "text",
  "isSensitive": false
}
```

#### Generate QR Code
```http
GET /users/qr-code
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "expiresAt": "2024-01-02T00:00:00.000Z"
  }
}
```

### Consent Management

#### Get All Consents
```http
GET /consent
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "serviceProviderId": "uuid",
      "serviceProviderName": "Hope Healthcare",
      "attributesShared": ["first_name", "last_name", "medical_conditions"],
      "purpose": "Access to healthcare services",
      "consentGiven": true,
      "consentDate": "2024-01-01T00:00:00.000Z",
      "expiryDate": "2025-01-01T00:00:00.000Z",
      "revoked": false
    }
  ]
}
```

#### Grant Consent
```http
POST /consent/grant
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "serviceProviderId": "uuid",
  "attributesShared": ["first_name", "last_name", "date_of_birth"],
  "purpose": "Educational enrollment",
  "expiryMonths": 12
}
```

#### Revoke Consent
```http
POST /consent/revoke
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "consentId": "uuid"
}
```

### Verification

#### Verify QR Code
```http
POST /verification/qr
```

**Request Body:**
```json
{
  "token": "verification_token",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR code verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "mosipId": "MOSIP1234567890",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "verified": true
  }
}
```

#### Verify PIN
```http
POST /verification/pin
```

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "pin": "123456"
}
```

### Service Providers

#### List Service Providers
```http
GET /service-providers
```

**Query Parameters:**
- `type` (optional): Filter by type (healthcare, education, humanitarian_aid, livelihood)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hope Healthcare Clinic",
      "type": "healthcare",
      "description": "Primary healthcare services",
      "logoUrl": "https://example.com/logo.png"
    }
  ]
}
```

#### Get Service Provider
```http
GET /service-providers/:id
```

### Admin Endpoints

All admin endpoints require admin authentication.

#### Get Users
```http
GET /admin/users
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

#### Get Audit Logs
```http
GET /admin/audit-logs
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `userId` (optional)
- `action` (optional)

#### Get Statistics
```http
GET /admin/statistics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 150,
    "totalUsers": 200,
    "activeServiceProviders": 10,
    "activeConsents": 75,
    "authentications24h": 50,
    "successfulAuthentications": 1000,
    "failedAuthentications": 50
  }
}
```

### MOSIP Integration

#### Register with MOSIP
```http
POST /mosip/register
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "biometricData": "...",
  "documentData": "..."
}
```

#### Verify MOSIP ID
```http
GET /mosip/verify/:mosipId
Authorization: Bearer <token>
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting

- Window: 15 minutes
- Max Requests: 100 per window

## Pagination

Endpoints that return lists support pagination:

```
?page=1&limit=20
```

Response includes pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

For more details, visit: http://localhost:5000/api-docs
