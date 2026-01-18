/**
 * Partner Registration Component
 * Self-service partner onboarding form
 */

import { useState } from 'react';
import axios from 'axios';
import styles from '../styles/PartnerRegistration.module.css';

const PartnerRegistration = () => {
    const [formData, setFormData] = useState({
        partnerName: '',
        partnerType: 'auth',
        organizationName: '',
        email: '',
        phone: '',
        address: '',
        website: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [partnerId, setPartnerId] = useState('');

    const partnerTypes = [
        { value: 'auth', label: 'Authentication Partner', description: 'Provide authentication services' },
        { value: 'ekyc', label: 'e-KYC Partner', description: 'Access e-KYC data' },
        { value: 'credential', label: 'Credential Partner', description: 'Issue credentials' },
        { value: 'misp', label: 'MISP Partner', description: 'MOSIP Integration Service Provider' },
        { value: 'device', label: 'Device Partner', description: 'Provide biometric devices' },
        { value: 'ftm', label: 'FTM Partner', description: 'Fingerprint Template Manager' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/partners/register`,
                formData
            );

            setSuccess(true);
            setPartnerId(response.data.partner.partnerId);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.successContainer}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>✅</div>
                    <h2>Registration Submitted!</h2>
                    <p>Your partner registration has been submitted for approval.</p>
                    <div className={styles.partnerIdBox}>
                        <label>Partner ID:</label>
                        <code>{partnerId}</code>
                    </div>
                    <div className={styles.nextSteps}>
                        <h3>Next Steps:</h3>
                        <ol>
                            <li>Wait for admin approval (typically 1-2 business days)</li>
                            <li>You'll receive an email notification once approved</li>
                            <li>Upload your CA-signed certificate</li>
                            <li>Generate API keys for integration</li>
                        </ol>
                    </div>
                    <button
                        onClick={() => {
                            setSuccess(false);
                            setFormData({
                                partnerName: '',
                                partnerType: 'auth',
                                organizationName: '',
                                email: '',
                                phone: '',
                                address: '',
                                website: ''
                            });
                        }}
                        className={styles.btnPrimary}
                    >
                        Register Another Partner
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.registrationContainer}>
            <div className={styles.header}>
                <h1>Partner Registration</h1>
                <p>Register your organization to integrate with DATAKOMEZA</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <h2>Partner Type</h2>
                    <div className={styles.typeGrid}>
                        {partnerTypes.map((type) => (
                            <label
                                key={type.value}
                                className={`${styles.typeCard} ${formData.partnerType === type.value ? styles.selected : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="partnerType"
                                    value={type.value}
                                    checked={formData.partnerType === type.value}
                                    onChange={handleChange}
                                />
                                <div className={styles.typeContent}>
                                    <h3>{type.label}</h3>
                                    <p>{type.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>Organization Details</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Partner Name *</label>
                            <input
                                type="text"
                                name="partnerName"
                                value={formData.partnerName}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Acme Authentication Services"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Organization Name *</label>
                            <input
                                type="text"
                                name="organizationName"
                                value={formData.organizationName}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Acme Corporation"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="partner@example.com"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1234567890"
                            />
                        </div>

                        <div className={styles.formGroup + ' ' + styles.fullWidth}>
                            <label>Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Organization address"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Website</label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.btnPrimary}
                    >
                        {loading ? 'Submitting...' : 'Submit Registration'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PartnerRegistration;
