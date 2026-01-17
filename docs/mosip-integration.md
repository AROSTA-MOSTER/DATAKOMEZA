# MOSIP Mock Services Integration Guide

## Overview

DATAKOMEZA integrates with **MOSIP Mock Services** to provide comprehensive biometric identity management for refugees. This integration enables:

- **Biometric Capture** via MockMDS
- **Deduplication** via mock-abis
- **Quality Checks** via mock-sdk
- **Data Validation** via mock-mv

## MOSIP Mock Services

The MOSIP Mock Services repository provides simulations of various MOSIP platform components for non-production environments.

**Repository**: https://github.com/mosip/mosip-mock-services

### Modules Integrated

#### 1. 🧪 MockMDS (MOSIP Device Service)
- **Purpose**: Simulates biometric device capture
- **Port**: 4501
- **Biometric Types**: Fingerprint, Iris, Face
- **Spec**: SBI (Secure Biometric Interface) 0.9.5

#### 2. 🧬 mock-abis (Automated Biometric Identification System)
- **Purpose**: Biometric deduplication and identification
- **Port**: 8081
- **Operations**: INSERT, IDENTIFY, DELETE
- **API**: Swagger available at `/swagger-ui.html`

#### 3. 🧩 mock-sdk (Software Development Kit)
- **Purpose**: Biometric quality check and matching
- **Port**: 8080
- **Operations**: Quality assessment, 1:1 matching
- **Modalities**: Fingerprint, Iris, Face

#### 4. 🛂 mock-mv (Master Data Validator)
- **Purpose**: Validates master data
- **Port**: 8082
- **Validation**: User data, documents, attributes

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  DATAKOMEZA Platform                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         MOSIP Integration Service              │    │
│  │                                                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │   MDS    │  │   ABIS   │  │   SDK    │    │    │
│  │  │ Service  │  │ Service  │  │ Service  │    │    │
│  │  └──────────┘  └──────────┘  └──────────┘    │    │
│  │       │              │              │          │    │
│  └───────┼──────────────┼──────────────┼─────────┘    │
│          │              │              │               │
└──────────┼──────────────┼──────────────┼───────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ MockMDS  │   │mock-abis │   │ mock-sdk │
    │ :4501    │   │ :8081    │   │ :8080    │
    └──────────┘   └──────────┘   └──────────┘
```

## Setup Instructions

### Option 1: Using Docker (Recommended)

1. **Clone MOSIP Mock Services**:
```bash
git clone https://github.com/mosip/mosip-mock-services.git
cd mosip-mock-services
```

2. **Start Services with Docker Compose**:
```bash
docker-compose up -d
```

This starts all mock services:
- MockMDS on port 4501
- mock-abis on port 8081
- mock-sdk on port 8080
- mock-mv on port 8082

3. **Verify Services**:
```bash
# Check MockMDS
curl http://localhost:4501/device

# Check mock-abis
curl http://localhost:8081/actuator/health

# Check mock-sdk
curl http://localhost:8080/actuator/health

# Check mock-mv
curl http://localhost:8082/actuator/health
```

### Option 2: Manual Setup

Follow the individual README files in each module:
- [MockMDS Setup](https://github.com/mosip/mosip-mock-services/tree/master/MockMDS)
- [mock-abis Setup](https://github.com/mosip/mosip-mock-services/tree/master/mock-abis)
- [mock-sdk Setup](https://github.com/mosip/mosip-mock-services/tree/master/mock-sdk)
- [mock-mv Setup](https://github.com/mosip/mosip-mock-services/tree/master/mock-mv)

## DATAKOMEZA Configuration

### Environment Variables

Update `backend/.env`:

```bash
# MOSIP Mock Services URLs
MOSIP_MDS_URL=http://localhost:4501
MOSIP_ABIS_URL=http://localhost:8081
MOSIP_SDK_URL=http://localhost:8080
MOSIP_MV_URL=http://localhost:8082
```

### Fallback Mode

DATAKOMEZA includes intelligent fallback:
- If MOSIP services are unavailable, it uses mock data
- Allows development without running all services
- Logs warnings when using fallback mode

## Registration Workflow

### Complete MOSIP Registration Process

```javascript
// 1. Discover Devices
GET /api/mosip/devices

// 2. Capture Biometric
POST /api/mosip/capture-biometric
{
  "deviceId": "MOCK_FP_001",
  "biometricType": "Fingerprint"
}

// 3. Quality Check
POST /api/mosip/quality-check
{
  "biometricData": "base64_encoded_data",
  "biometricType": "Fingerprint"
}

// 4. Register with MOSIP (Full workflow)
POST /api/mosip/register
{
  "biometricData": "captured_data",
  "documentData": "optional_documents"
}
```

### What Happens During Registration

1. **Device Discovery**: Find available biometric devices
2. **Biometric Capture**: Capture fingerprint/iris/face
3. **Quality Check**: Verify biometric quality (SDK)
4. **Deduplication**: Check for duplicates (ABIS)
5. **Data Validation**: Validate user data (MV)
6. **MOSIP ID Generation**: Create unique MOSIP ID
7. **Database Storage**: Store MOSIP ID and reference

## API Endpoints

### Health Check
```http
GET /api/mosip/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "services": {
      "mds": true,
      "abis": true,
      "sdk": true,
      "mv": true
    },
    "message": "All MOSIP services available"
  }
}
```

### Discover Devices
```http
GET /api/mosip/devices
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "deviceId": "MOCK_FP_001",
        "deviceType": "Fingerprint",
        "deviceStatus": "Ready"
      }
    ]
  }
}
```

### Capture Biometric
```http
POST /api/mosip/capture-biometric
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "MOCK_FP_001",
  "biometricType": "Fingerprint"
}
```

### Register with MOSIP
```http
POST /api/mosip/register
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully registered with MOSIP",
  "data": {
    "mosipId": "MOSIP1234567890",
    "referenceId": "REF_1234567890_abc123",
    "biometricQuality": 85,
    "status": "registered"
  }
}
```

### Verify Identity
```http
POST /api/mosip/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "biometricData": "base64_encoded_biometric"
}
```

## Biometric Types Supported

### Fingerprint
- **Capture**: 2 fingers (Left Index, Right Index)
- **Quality Threshold**: 60
- **Format**: ISO 19794-4

### Iris
- **Capture**: Both eyes
- **Quality Threshold**: 60
- **Format**: ISO 19794-6

### Face
- **Capture**: Full face
- **Quality Threshold**: 60
- **Format**: ISO 19794-5

## Deduplication Process

### How ABIS Prevents Duplicates

1. **Insert**: New biometric inserted into ABIS gallery
2. **Identify**: ABIS searches for similar biometrics
3. **Match**: Returns candidates with confidence scores
4. **Decision**: Registration blocked if duplicate found

### Example Deduplication

```javascript
// Insert biometric
await mosipService.abis.insertBiometric(referenceId, biometricData);

// Check for duplicates
const result = await mosipService.abis.identifyBiometric(referenceId, biometricData);

if (result.isDuplicate) {
  // Duplicate found - reject registration
  console.log('Duplicate detected:', result.candidates);
  console.log('Confidence:', result.confidence);
}
```

## Quality Checks

### Biometric Quality Standards

- **Minimum Score**: 60/100
- **Recommended**: 75+
- **Excellent**: 85+

### Quality Check Process

```javascript
const qualityResult = await mosipService.sdk.checkQuality(
  biometricData,
  'Fingerprint'
);

if (qualityResult.qualityScore < 60) {
  // Reject - quality too low
  return 'Please recapture biometric';
}
```

## Error Handling

### Service Unavailable

If MOSIP services are down:
```javascript
{
  "success": false,
  "message": "Using mock biometric data",
  "biometricData": { /* mock data */ }
}
```

### Quality Too Low

```javascript
{
  "success": false,
  "message": "Biometric quality too low. Please try again.",
  "qualityScore": 45
}
```

### Duplicate Detected

```javascript
{
  "success": false,
  "message": "Duplicate identity detected. This person is already registered.",
  "duplicateConfidence": 95
}
```

## Testing

### Test Registration Flow

1. **Start MOSIP Services**:
```bash
cd mosip-mock-services
docker-compose up -d
```

2. **Start DATAKOMEZA**:
```bash
cd DATAKOMEZA
npm run dev
```

3. **Test via API**:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"amina.refugee@example.com","pin":"123456"}'

# Register with MOSIP
curl -X POST http://localhost:5000/api/mosip/register \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Test Deduplication

1. Register first user - Success
2. Try to register same user again - Duplicate detected
3. Verify confidence score > 90%

## Production Deployment

### Replace Mock Services

For production, replace mock services with:

1. **Real MOSIP Platform**: https://mosip.io
2. **Actual Biometric Devices**: Certified SBI devices
3. **Production ABIS**: Commercial ABIS solution
4. **HSM**: Hardware Security Module for crypto

### Configuration

```bash
# Production MOSIP URLs
MOSIP_MDS_URL=https://mds.production.mosip.io
MOSIP_ABIS_URL=https://abis.production.mosip.io
MOSIP_SDK_URL=https://sdk.production.mosip.io
MOSIP_MV_URL=https://mv.production.mosip.io
```

## Security Considerations

### Data Protection

- Biometric data encrypted in transit (HTTPS)
- Biometric templates never stored in plain text
- ABIS gallery access restricted
- Audit logs for all biometric operations

### Privacy

- Biometric data used only for deduplication
- No biometric data shared with service providers
- User consent required for identity verification
- Right to deletion (GDPR compliant)

## Monitoring

### Health Checks

```bash
# Check all services
curl http://localhost:5000/api/mosip/health
```

### Logs

```bash
# Backend logs
tail -f backend/logs/info.log

# MOSIP service logs
docker-compose logs -f
```

## Troubleshooting

### Services Not Starting

```bash
# Check Docker
docker ps

# Restart services
docker-compose restart

# View logs
docker-compose logs
```

### Connection Refused

1. Verify services are running
2. Check firewall settings
3. Confirm port numbers in `.env`

### Low Quality Scores

1. Ensure good lighting for face capture
2. Clean fingerprint sensor
3. Adjust capture settings
4. Retry capture

## Resources

- **MOSIP Documentation**: https://docs.mosip.io
- **Mock Services Repo**: https://github.com/mosip/mosip-mock-services
- **SBI Specification**: https://docs.mosip.io/1.2.0/biometrics/biometric-specification
- **ABIS API**: https://docs.mosip.io/1.2.0/biometrics/abis-api

## Support

For MOSIP-related issues:
- **MOSIP Community**: https://community.mosip.io
- **GitHub Issues**: https://github.com/mosip/mosip-mock-services/issues

For DATAKOMEZA integration:
- **Email**: support@datakomeza.org
- **Documentation**: `/docs/mosip-integration.md`

---

**Note**: MOSIP Mock Services are for development and testing only. Use actual MOSIP platform components in production.
