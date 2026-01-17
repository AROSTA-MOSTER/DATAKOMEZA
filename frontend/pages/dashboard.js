/**
 * User Dashboard
 * Main dashboard for refugee users
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [consents, setConsents] = useState([]);
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

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

    if (authLoading || loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
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
                        <h1>DATAKOMEZA</h1>
                        <div className={styles.headerActions}>
                            <span className="text-muted">
                                Welcome, {profile?.first_name || user?.firstName}
                            </span>
                            <button onClick={logout} className="btn btn-secondary btn-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className={styles.container}>
                    {/* Sidebar */}
                    <aside className={styles.sidebar}>
                        <nav className={styles.nav}>
                            <button
                                className={activeTab === 'overview' ? styles.navItemActive : styles.navItem}
                                onClick={() => setActiveTab('overview')}
                            >
                                📊 Overview
                            </button>
                            <button
                                className={activeTab === 'profile' ? styles.navItemActive : styles.navItem}
                                onClick={() => setActiveTab('profile')}
                            >
                                👤 Profile
                            </button>
                            <button
                                className={activeTab === 'consents' ? styles.navItemActive : styles.navItem}
                                onClick={() => setActiveTab('consents')}
                            >
                                🤝 Consents
                            </button>
                            <button
                                className={activeTab === 'qr' ? styles.navItemActive : styles.navItem}
                                onClick={() => setActiveTab('qr')}
                            >
                                📱 QR Code
                            </button>
                            <button
                                className={activeTab === 'services' ? styles.navItemActive : styles.navItem}
                                onClick={() => setActiveTab('services')}
                            >
                                🏥 Services
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className={styles.main}>
                        {activeTab === 'overview' && (
                            <div className="fade-in">
                                <h2>Overview</h2>
                                <div className="grid grid-3 gap-2 mt-2">
                                    <div className="card">
                                        <h3>MOSIP ID</h3>
                                        <p className={styles.statValue}>{profile?.mosip_id || 'Not registered'}</p>
                                    </div>
                                    <div className="card">
                                        <h3>Active Consents</h3>
                                        <p className={styles.statValue}>{consents.filter(c => !c.revoked).length}</p>
                                    </div>
                                    <div className="card">
                                        <h3>Account Status</h3>
                                        <p className={styles.statValue}>
                                            <span className="badge badge-success">Active</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="card mt-2">
                                    <h3>Quick Actions</h3>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => setActiveTab('qr')} className="btn btn-primary">
                                            Generate QR Code
                                        </button>
                                        <button onClick={() => setActiveTab('services')} className="btn btn-secondary">
                                            Browse Services
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="fade-in">
                                <h2>Profile Information</h2>
                                <div className="card mt-2">
                                    <div className={styles.profileGrid}>
                                        <div>
                                            <label className="text-muted">Full Name</label>
                                            <p>{profile?.first_name} {profile?.last_name}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted">Email</label>
                                            <p>{profile?.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted">Phone</label>
                                            <p>{profile?.phone || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted">Date of Birth</label>
                                            <p>{profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted">Gender</label>
                                            <p>{profile?.gender || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted">Nationality</label>
                                            <p>{profile?.nationality || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'consents' && (
                            <div className="fade-in">
                                <h2>Consent Records</h2>
                                <p className="text-muted">Manage your data sharing permissions</p>

                                {consents.length === 0 ? (
                                    <div className="card mt-2 text-center">
                                        <p className="text-muted">No consent records yet</p>
                                        <button onClick={() => setActiveTab('services')} className="btn btn-primary mt-2">
                                            Browse Services
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        {consents.map((consent) => (
                                            <div key={consent.id} className="card mb-2">
                                                <div className="flex-between">
                                                    <div>
                                                        <h4>{consent.service_provider_name}</h4>
                                                        <p className="text-muted">{consent.purpose}</p>
                                                        <p className="text-muted">
                                                            <small>
                                                                Granted: {new Date(consent.consent_date).toLocaleDateString()}
                                                                {consent.expiry_date && ` • Expires: ${new Date(consent.expiry_date).toLocaleDateString()}`}
                                                            </small>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        {consent.revoked ? (
                                                            <span className="badge badge-error">Revoked</span>
                                                        ) : (
                                                            <span className="badge badge-success">Active</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'qr' && (
                            <div className="fade-in">
                                <h2>QR Code Authentication</h2>
                                <p className="text-muted">Generate a QR code for offline verification</p>

                                {!qrCode ? (
                                    <div className="card mt-2 text-center">
                                        <p>Click the button below to generate your QR code</p>
                                        <button onClick={generateQRCode} className="btn btn-primary mt-2">
                                            Generate QR Code
                                        </button>
                                    </div>
                                ) : (
                                    <div className="card mt-2 text-center">
                                        <div className={styles.qrCodeContainer}>
                                            <QRCodeSVG value={qrCode.qrCode} size={300} level="H" />
                                        </div>
                                        <p className="text-muted mt-2">
                                            This QR code expires on {new Date(qrCode.expiresAt).toLocaleString()}
                                        </p>
                                        <button onClick={generateQRCode} className="btn btn-secondary mt-2">
                                            Generate New Code
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'services' && (
                            <div className="fade-in">
                                <h2>Available Services</h2>
                                <p className="text-muted">Connect with service providers</p>

                                <div className="grid grid-2 gap-2 mt-2">
                                    <div className="card">
                                        <h3>🏥 Healthcare</h3>
                                        <p className="text-muted">Access medical services and health records</p>
                                        <button className="btn btn-primary mt-2">Browse Providers</button>
                                    </div>
                                    <div className="card">
                                        <h3>📚 Education</h3>
                                        <p className="text-muted">Enroll in educational programs</p>
                                        <button className="btn btn-primary mt-2">Browse Programs</button>
                                    </div>
                                    <div className="card">
                                        <h3>🌍 Humanitarian Aid</h3>
                                        <p className="text-muted">Connect with aid organizations</p>
                                        <button className="btn btn-primary mt-2">Browse Organizations</button>
                                    </div>
                                    <div className="card">
                                        <h3>💼 Livelihoods</h3>
                                        <p className="text-muted">Find job training and employment</p>
                                        <button className="btn btn-primary mt-2">Browse Opportunities</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}
