# DATAKOMEZA - Digital Identity Platform for Refugees

<div align="center">

![DATAKOMEZA](https://img.shields.io/badge/DATAKOMEZA-Digital_Identity-6366f1?style=for-the-badge&logo=shield&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)
![MOSIP](https://img.shields.io/badge/MOSIP-Compliant-blue?style=for-the-badge)

**A MOSIP-aligned foundational identity platform enabling refugees and vulnerable populations to access humanitarian services through secure digital credentials.**

[Features](#-key-features) • [Workflow](#-identity-registration-workflow) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 🌍 Overview

**DATAKOMEZA** (meaning "to continue" in Kinyarwanda) is a comprehensive digital identity solution designed specifically for refugees and asylum seekers in Africa. The platform provides a secure, privacy-preserving way to:

- ✅ **Establish legal identity** without relying on lost or inaccessible documents
- ✅ **Access essential services** (healthcare, education, humanitarian aid)
- ✅ **Prevent fraud** through biometric deduplication
- ✅ **Maintain privacy** with consent-based data sharing
- ✅ **Operate offline** in low-connectivity environments

### Why DATAKOMEZA?

| Challenge | DATAKOMEZA Solution |
|-----------|---------------------|
| 1 billion people lack official ID | Foundational ID for displaced populations |
| Lost/destroyed identity documents | Digital credentials with biometric verification |
| Duplicate beneficiary registrations | ABIS-powered deduplication |
| Privacy concerns with data sharing | Consent-based attribute sharing |
| No internet in remote camps | QR code + PIN offline authentication |

---

## 🔑 Key Features

### 🆔 MOSIP-Aligned Identity Lifecycle
Complete implementation of the MOSIP (Modular Open Source Identity Platform) identity management framework:
- Pre-enrolment demographic capture
- Admin review and approval workflow
- Biometric capture (face, fingerprints, iris, signature)
- ABIS deduplication check
- Digital credential issuance with QR codes

### 🔐 Post-Quantum Cryptography
**Industry-first** quantum-resistant security:
- **CRYSTALS-Kyber** for key encapsulation
- **CRYSTALS-Dilithium** for digital signatures
- **AES-256-GCM** + quantum-safe hybrid encryption
- Future-proof against quantum computer attacks

### 📱 Multi-Channel Authentication
- QR code scanning for instant verification
- PIN-based offline authentication
- Biometric verification (1:1 matching)
- OTP as secondary factor

### 🏥 Service Integration
Pre-built integrations for:
- Healthcare providers
- Educational institutions
- Humanitarian aid organizations
- Financial services (KYC)

---

## 🔄 Identity Registration Workflow

DATAKOMEZA implements a 4-phase MOSIP-compliant registration process:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DATAKOMEZA IDENTITY LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: PRE-ENROLMENT                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ User submits demographic data via web/mobile:                       │   │
│  │ • Full name, Date of birth, Gender                                  │   │
│  │ • Place of birth, Parents' names                                    │   │
│  │ • Nationality, Marital status                                       │   │
│  │ • Current address, Contact information                              │   │
│  │                                                                     │   │
│  │ Status: PENDING_VERIFICATION                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▼                                        │
│  PHASE 2: ADMIN REVIEW                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Registration Officer reviews submitted data:                        │   │
│  │ • Validate demographic information                                  │   │
│  │ • Request corrections if needed → User updates → Re-review          │   │
│  │ • Approve for biometric enrolment                                   │   │
│  │ • OR Reject with documented reason                                  │   │
│  │                                                                     │   │
│  │ Status: APPROVED_FOR_BIOMETRIC or REJECTED                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▼                                        │
│  PHASE 3: BIOMETRIC CAPTURE                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Supervised in-person biometric enrolment:                           │   │
│  │ • Face photograph (live capture)                                    │   │
│  │ • 10 fingerprints with quality check                                │   │
│  │ • Iris scan (optional)                                              │   │
│  │ • Digital signature                                                 │   │
│  │                                                                     │   │
│  │ Quality Check (SDK) → ABIS Deduplication → Result                   │   │
│  │                                                                     │   │
│  │ If duplicate found: Status → FLAGGED_DUPLICATE (manual review)      │   │
│  │ If unique: Status → BIOMETRICS_VERIFIED                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▼                                        │
│  PHASE 4: ID ISSUANCE                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Digital credential generation:                                      │   │
│  │ • Unique MOSIP ID (UIN) assigned                                    │   │
│  │ • QR code generated for verification                                │   │
│  │ • Digital credential created                                        │   │
│  │ • Optional: Physical ID card                                        │   │
│  │                                                                     │   │
│  │ Status: ACTIVE_VERIFIED                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Flow Diagram

```
pending_verification
        │
        ├──→ correction_requested ──→ (user updates) ──→ pending_verification
        │
        ├──→ rejected
        │
        └──→ approved_for_biometric
                     │
                     └──→ biometrics_verified ──→ active_verified
                              │
                              └──→ flagged_duplicate ──→ (admin resolves) ──→ biometrics_verified / rejected
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/AROSTA-MOSTER/DATAKOMEZA.git
cd DATAKOMEZA

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

### Option 2: Manual Setup

```bash
# Clone repository
git clone https://github.com/AROSTA-MOSTER/DATAKOMEZA.git
cd DATAKOMEZA

# Install dependencies
npm run install:all

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Start development servers
npm run dev:backend   # Terminal 1: Backend on :5000
npm run dev:frontend  # Terminal 2: Frontend on :3000
```

### Default Test Credentials

| Role | Email | Password/PIN |
|------|-------|--------------|
| Refugee User | `amina.refugee@example.com` | PIN: `123456` |
| Admin | `admin@ngo.org` | Password: `Admin@123` |

---

## 📡 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Submit pre-enrolment request |
| `POST` | `/api/auth/login` | User login with PIN |
| `POST` | `/api/auth/admin/login` | Admin login |

### Admin Workflow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users/pending` | List pending registrations |
| `GET` | `/api/admin/users/:id/details` | Full user details for review |
| `POST` | `/api/admin/users/:id/request-correction` | Request user to fix fields |
| `POST` | `/api/admin/users/:id/reject` | Reject registration |
| `POST` | `/api/admin/users/:id/approve-biometric` | Approve for biometric capture |
| `POST` | `/api/admin/users/:id/capture-biometrics-full` | Capture biometrics + dedup |
| `POST` | `/api/admin/users/:id/issue-digital-id` | Issue MOSIP ID + QR |
| `GET` | `/api/admin/users/flagged-duplicates` | List flagged duplicates |
| `POST` | `/api/admin/users/:id/resolve-duplicate` | Resolve duplicate case |

### Verification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/verification/qr` | Verify QR code token |
| `POST` | `/api/verification/pin` | Verify PIN offline |
| `POST` | `/api/authentication/biometric` | Biometric authentication |

---

## 🏗️ Architecture

```
DATAKOMEZA/
├── frontend/                    # Next.js 14 + React 18
│   ├── components/              # Reusable UI components
│   ├── pages/                   # Route pages
│   ├── context/                 # Auth context
│   └── styles/                  # CSS Modules
│
├── backend/                     # Express.js API
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.js          # Authentication
│   │   │   ├── admin.js         # Admin workflow
│   │   │   ├── users.js         # User profile
│   │   │   └── verification.js  # Identity verification
│   │   ├── services/
│   │   │   ├── mosipMockService.js  # MOSIP integration
│   │   │   └── authenticationService.js
│   │   ├── middleware/          # Auth, rate limiting
│   │   └── utils/               # Encryption, logging
│   └── .env                     # Environment config
│
├── database/
│   └── migrations/              # SQL schema files
│       ├── 000_initial_schema.sql
│       ├── 002_add_preenrolment_fields.sql
│       └── 003_biometric_records.sql
│
└── docker-compose.yml           # Container orchestration
```

---

## 🔒 Security

### Encryption
- **At Rest**: AES-256-GCM with quantum-safe key encapsulation
- **In Transit**: TLS 1.3
- **Secrets**: No hardcoded keys - all from environment variables

### Authentication
- JWT tokens with configurable expiry
- bcrypt password hashing (cost factor 10)
- Rate limiting on auth endpoints (5 attempts/15 min)

### Compliance
- GDPR-style privacy by design
- Consent-based data sharing
- Immutable audit logs
- UNHCR humanitarian data protection guidelines

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret for JWT signing (64+ chars) | ✅ |
| `ENCRYPTION_KEY` | AES encryption key (32+ chars) | ✅ |
| `DB_HOST` | PostgreSQL host | ✅ |
| `DB_PORT` | PostgreSQL port (default: 5432) | ✅ |
| `DB_USER` | Database username | ✅ |
| `DB_PASSWORD` | Database password | ✅ |
| `DB_NAME` | Database name | ✅ |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- [MOSIP Foundation](https://mosip.io) - Identity platform standards
- [UNHCR](https://unhcr.org) - Refugee protection guidelines
- Open-source community for amazing tools

---

<div align="center">

**Built with ❤️ for refugees and asylum seekers in Africa**

[⬆ Back to Top](#datakomeza---digital-identity-platform-for-refugees)

</div>
