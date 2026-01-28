/**
 * User Dashboard
 * Refined dashboard matching design mockup
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import ToggleSwitch from '../components/ToggleSwitch';
import api from '../utils/api';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [consents, setConsents] = useState([]);
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated && !user?.isAdmin) {
            loadDashboardData();
        }
    }, [isAuthenticated, authLoading, user, router]);

    const loadDashboardData = async () => {
        try {
            const [profileRes, consentsRes] = await Promise.all([
                api.get('/users/profile'),
                api.get('/consent')
            ]);

            if (profileRes.data.success) {
                setProfile(profileRes.data.data);
            }

            if (consentsRes.data.success) {
                setConsents(consentsRes.data.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async () => {
        try {
            const response = await api.get('/users/qr-code');
            if (response.data.success) {
                setQrCode(response.data.data);
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    const handleConsentToggle = async (consentId) => {
        try {
            const consent = consents.find(c => c.id === consentId);
            if (consent.revoked) {
                // Re-enable consent (would need backend endpoint)
                console.log('Re-enable consent:', consentId);
            } else {
                await api.post(`/consent/${consentId}/revoke`);
                setConsents(consents.map(c =>
                    c.id === consentId ? { ...c, revoked: true } : c
                ));
            }
        } catch (error) {
            console.error('Error toggling consent:', error);
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const activeConsents = consents.filter(c => !c.revoked).length;
    const totalVerifications = 34; // Mock data

    const services = [
        { id: 1, name: 'Healthcare', icon: '🏥', description: 'Manage provider & services' },
        { id: 2, name: 'Education', icon: '🎓', description: 'Manage provider, education' },
        { id: 3, name: 'Aid', icon: '🤝', description: 'Manage provider services' },
        { id: 4, name: 'Repatriation', icon: '✈️', description: 'Manage provider services' }
    ];

    if (authLoading || loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // Render pending verification view
    if (user?.status === 'pending_verification') {
        return (
            <>
                <Head>
                    <title>Verification Pending - DATAKOMEZA</title>
                </Head>
                <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>
                    <div className={styles.card} style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
                        <h1 style={{ marginBottom: '1rem', color: '#1e1b4b' }}>Application Under Review</h1>
                        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '2rem' }}>
                            Your registration request has been received and is currently being reviewed by our administration team.
                            You will be notified once your application is approved for biometric enrolment.
                        </p>
                        <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', color: '#0369a1', fontSize: '0.9rem' }}>
                            Reference ID: {user?.id?.split('-')[0].toUpperCase()}
                        </div>
                        <button onClick={logout} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', border: '1px solid #ddd', background: 'transparent', borderRadius: '8px', cursor: 'pointer' }}>
                            Sign Out
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // Render approved for biometric view
    if (user?.status === 'approved_for_biometric') {
        return (
            <>
                <Head>
                    <title>Ready for Biometrics - DATAKOMEZA</title>
                </Head>
                <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>
                    <div className={styles.card} style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧬</div>
                        <h1 style={{ marginBottom: '1rem', color: '#1e1b4b' }}>Ready for Biometrics</h1>
                        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '2rem' }}>
                            Your application has been approved! Please visit the nearest registration center to complete your biometric enrolment (Face, Fingerprints, Iris).
                        </p>
                        <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px', color: '#047857', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Status: Approved for Capture
                        </div>
                        <button onClick={logout} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', border: '1px solid #ddd', background: 'transparent', borderRadius: '8px', cursor: 'pointer' }}>
                            Sign Out
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Dashboard - DATAKOMEZA</title>
            </Head>

            <div className={styles.dashboard}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h1>DATAKOMEZA</h1>
                            <div className={styles.quantumSecureBadge}>
                                🔒 QUANTUM SECURE
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <button onClick={logout} className="btn btn-secondary btn-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className={styles.container}>
                    {/* Main Content */}
                    <main className={styles.main}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#111827' }}>
                            Profile
                        </h2>

                        <div className={styles.dashboardGrid}>
                            {/* Left Column */}
                            <div className={styles.leftColumn}>
                                {/* Profile Card */}
                                <div className={styles.profileCard}>
                                    <div className={styles.profileHeader}>
                                        <div className={styles.profilePhoto}>
                                            {getInitials(profile?.first_name, profile?.last_name)}
                                        </div>
                                        <div className={styles.profileInfo}>
                                            <h2>{profile?.first_name} {profile?.last_name}</h2>
                                            <p className={styles.refugeeId}>
                                                Refugee ID: {profile?.mosip_id || '0470005814'}
                                            </p>
                                            <span className={styles.statusBadge}>Privated</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Consent Management */}
                                <div className={styles.consentSection}>
                                    <h3>Consent Management</h3>
                                    <div className={styles.consentList}>
                                        {consents.length > 0 ? (
                                            consents.slice(0, 3).map((consent) => (
                                                <div key={consent.id} className={styles.consentItem}>
                                                    <div className={styles.consentInfo}>
                                                        <h4>{consent.purpose || 'Data sharing consent'}</h4>
                                                        <p>{consent.provider_name || 'Service provider'}</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        checked={!consent.revoked}
                                                        onChange={() => handleConsentToggle(consent.id)}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <>
                                                <div className={styles.consentItem}>
                                                    <div className={styles.consentInfo}>
                                                        <h4>Data sharing data consentroots</h4>
                                                    </div>
                                                    <ToggleSwitch checked={true} onChange={() => { }} />
                                                </div>
                                                <div className={styles.consentItem}>
                                                    <div className={styles.consentInfo}>
                                                        <h4>Data sharing on evanitation on docs</h4>
                                                    </div>
                                                    <ToggleSwitch checked={true} onChange={() => { }} />
                                                </div>
                                                <div className={styles.consentItem}>
                                                    <div className={styles.consentInfo}>
                                                        <h4>Data sharing inteventor patwents</h4>
                                                    </div>
                                                    <ToggleSwitch checked={true} onChange={() => { }} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className={styles.qrSection}>
                                    <div className={styles.qrCard}>
                                        {!qrCode ? (
                                            <button onClick={generateQRCode} className={styles.qrButton}>
                                                Generate QR Code
                                            </button>
                                        ) : (
                                            <div className={styles.qrCodeContainer}>
                                                <img src={qrCode.qrCode} alt="QR Code" style={{ maxWidth: '200px' }} />
                                            </div>
                                        )}
                                        <p className={styles.qrLabel}>Scan for Verification</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className={styles.rightColumn}>
                                {/* Stats Cards */}
                                <div className={styles.statsRow}>
                                    <div className={styles.miniStatCard}>
                                        <h4>Active Consents</h4>
                                        <div className={styles.statValue}>{activeConsents}</div>
                                        <div className={styles.trendIndicator}>📈</div>
                                    </div>
                                    <div className={styles.miniStatCard}>
                                        <h4>Verifications</h4>
                                        <div className={styles.statValue}>{totalVerifications}</div>
                                        <div className={styles.trendIndicator}>📈</div>
                                    </div>
                                </div>

                                <div className={styles.statsRow}>
                                    <div className={styles.miniStatCard}>
                                        <h4>Verifications</h4>
                                        <div className={styles.statValue}>52</div>
                                        <div className={styles.trendIndicator}>📈</div>
                                    </div>
                                    <div className={styles.miniStatCard}>
                                        <h4>User Activity</h4>
                                        <div className={styles.statValue}>128</div>
                                        <div className={styles.trendIndicator}>📈</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Service Providers */}
                        <div className={styles.servicesSection}>
                            <h3>Service Providers</h3>
                            <div className={styles.servicesGrid}>
                                {services.map((service) => (
                                    <div key={service.id} className={styles.serviceCard}>
                                        <div className={styles.serviceIcon}>{service.icon}</div>
                                        <h3>{service.name}</h3>
                                        <p>{service.description}</p>
                                        <button className={styles.serviceButton}>Manage Access</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
