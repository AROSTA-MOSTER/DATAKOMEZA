/**
 * Partner Dashboard Component
 * Displays partner information, API keys, and certificates
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/PartnerDashboard.module.css';

const PartnerDashboard = ({ partnerId }) => {
    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showApiKeyForm, setShowApiKeyForm] = useState(false);
    const [showCertForm, setShowCertForm] = useState(false);

    useEffect(() => {
        loadPartnerData();
    }, [partnerId]);

    const loadPartnerData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/partners/${partnerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPartner(response.data.data);
        } catch (err) {
            setError('Failed to load partner data');
        } finally {
            setLoading(false);
        }
    };

    const generateAPIKey = async (keyType) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/partners/${partnerId}/api-key`,
                { keyType },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`API Key Generated!\n\nKey: ${response.data.apiKey}\nSecret: ${response.data.apiSecret}\n\nSave these credentials securely. The secret will not be shown again.`);
            setShowApiKeyForm(false);
            loadPartnerData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate API key');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'inactive': return '#6b7280';
            case 'suspended': return '#ef4444';
            default: return '#6b7280';
        }
    };

    if (loading && !partner) {
        return <div className={styles.loading}>Loading partner data...</div>;
    }

    if (error && !partner) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!partner) {
        return null;
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1>{partner.partner_name}</h1>
                    <p>{partner.organization_name}</p>
                </div>
                <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor(partner.status) }}>
                    {partner.status}
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.grid}>
                {/* Partner Info Card */}
                <div className={styles.card}>
                    <h2>Partner Information</h2>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Partner ID:</span>
                            <code className={styles.value}>{partner.partner_id}</code>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Type:</span>
                            <span className={styles.value}>{partner.partner_type}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Email:</span>
                            <span className={styles.value}>{partner.email}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Phone:</span>
                            <span className={styles.value}>{partner.phone || 'N/A'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Registered:</span>
                            <span className={styles.value}>
                                {new Date(partner.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Approval Status:</span>
                            <span className={styles.badge} style={{ backgroundColor: getStatusColor(partner.approval_status) }}>
                                {partner.approval_status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* API Keys Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>API Keys</h2>
                        {partner.status === 'active' && (
                            <button
                                onClick={() => setShowApiKeyForm(!showApiKeyForm)}
                                className={styles.btnSmall}
                            >
                                + Generate Key
                            </button>
                        )}
                    </div>

                    {showApiKeyForm && (
                        <div className={styles.formBox}>
                            <p>Select key type:</p>
                            <div className={styles.buttonGroup}>
                                <button
                                    onClick={() => generateAPIKey('sandbox')}
                                    disabled={loading}
                                    className={styles.btnSecondary}
                                >
                                    Sandbox
                                </button>
                                <button
                                    onClick={() => generateAPIKey('production')}
                                    disabled={loading}
                                    className={styles.btnPrimary}
                                >
                                    Production
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.placeholder}>
                        <p>API keys will be listed here</p>
                        <p className={styles.hint}>Generate an API key to start integration</p>
                    </div>
                </div>

                {/* Certificate Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Certificate</h2>
                        {partner.status === 'active' && (
                            <button
                                onClick={() => setShowCertForm(!showCertForm)}
                                className={styles.btnSmall}
                            >
                                Upload Certificate
                            </button>
                        )}
                    </div>

                    {partner.certificate_expiry ? (
                        <div className={styles.certInfo}>
                            <div className={styles.certStatus}>
                                <span className={styles.certIcon}>✅</span>
                                <span>Certificate Uploaded</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Expires:</span>
                                <span className={styles.value}>
                                    {new Date(partner.certificate_expiry).toLocaleDateString()}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Thumbprint:</span>
                                <code className={styles.valueSmall}>
                                    {partner.certificate_thumbprint?.substring(0, 20)}...
                                </code>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.placeholder}>
                            <p>No certificate uploaded</p>
                            <p className={styles.hint}>Upload a CA-signed certificate for authentication</p>
                        </div>
                    )}
                </div>

                {/* Integration Guide Card */}
                <div className={styles.card + ' ' + styles.fullWidth}>
                    <h2>Integration Guide</h2>
                    <div className={styles.guideSteps}>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>1</div>
                            <div className={styles.stepContent}>
                                <h3>Generate API Keys</h3>
                                <p>Create sandbox keys for testing and production keys for live integration</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>2</div>
                            <div className={styles.stepContent}>
                                <h3>Upload Certificate</h3>
                                <p>Upload your CA-signed certificate for secure communication</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>3</div>
                            <div className={styles.stepContent}>
                                <h3>Review Documentation</h3>
                                <p>Check the API documentation for integration examples</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>4</div>
                            <div className={styles.stepContent}>
                                <h3>Start Integration</h3>
                                <p>Begin testing with sandbox environment before going live</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerDashboard;
