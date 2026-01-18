/**
 * Authentication Controls Component
 * Allows users to lock/unlock authentication methods
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AuthControls.module.css';

const AuthenticationControls = ({ userId }) => {
    const [authLocks, setAuthLocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const authTypes = [
        { value: 'biometric', label: 'Biometric', icon: '🔐' },
        { value: 'otp', label: 'OTP', icon: '📱' },
        { value: 'demographic', label: 'Demographic', icon: '👤' }
    ];

    const biometricModalities = [
        { value: 'fingerprint', label: 'Fingerprint', icon: '👆' },
        { value: 'iris', label: 'Iris', icon: '👁️' },
        { value: 'face', label: 'Face', icon: '😊' }
    ];

    useEffect(() => {
        loadAuthLocks();
    }, [userId]);

    const loadAuthLocks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/resident/auth/locks/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAuthLocks(response.data.data);
        } catch (err) {
            setError('Failed to load authentication locks');
        } finally {
            setLoading(false);
        }
    };

    const toggleLock = async (authType, biometricModality = null, currentlyLocked = false) => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            const endpoint = currentlyLocked ? 'unlock' : 'lock';

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/resident/auth/${endpoint}`,
                {
                    userId,
                    authType,
                    biometricModality,
                    lockReason: currentlyLocked ? null : 'User requested'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(`Authentication ${currentlyLocked ? 'unlocked' : 'locked'} successfully`);
            loadAuthLocks();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update lock status');
        } finally {
            setLoading(false);
        }
    };

    const isLocked = (authType, biometricModality = null) => {
        return authLocks.some(
            lock =>
                lock.auth_type === authType &&
                (biometricModality === null || lock.biometric_modality === biometricModality) &&
                lock.is_locked
        );
    };

    return (
        <div className={styles.authControls}>
            <div className={styles.header}>
                <h2>Authentication Controls</h2>
                <p className={styles.subtitle}>
                    Manage which authentication methods are enabled for your account
                </p>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <div className={styles.controlsGrid}>
                {/* Standard Authentication Methods */}
                {authTypes.filter(type => type.value !== 'biometric').map((authType) => {
                    const locked = isLocked(authType.value);
                    return (
                        <div key={authType.value} className={styles.controlCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconLabel}>
                                    <span className={styles.icon}>{authType.icon}</span>
                                    <h3>{authType.label}</h3>
                                </div>
                                <div className={styles.statusBadge} data-locked={locked}>
                                    {locked ? 'Locked' : 'Active'}
                                </div>
                            </div>
                            <div className={styles.cardBody}>
                                <p className={styles.description}>
                                    {authType.value === 'otp'
                                        ? 'One-time password sent via SMS or email'
                                        : 'Authentication using personal information'}
                                </p>
                            </div>
                            <div className={styles.cardActions}>
                                <button
                                    onClick={() => toggleLock(authType.value, null, locked)}
                                    disabled={loading}
                                    className={locked ? styles.btnUnlock : styles.btnLock}
                                >
                                    {locked ? '🔓 Unlock' : '🔒 Lock'}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Biometric Authentication with Modalities */}
                <div className={styles.controlCard + ' ' + styles.biometricCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.iconLabel}>
                            <span className={styles.icon}>🔐</span>
                            <h3>Biometric Authentication</h3>
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        <p className={styles.description}>
                            Control individual biometric authentication methods
                        </p>
                        <div className={styles.modalitiesGrid}>
                            {biometricModalities.map((modality) => {
                                const locked = isLocked('biometric', modality.value);
                                return (
                                    <div key={modality.value} className={styles.modalityItem}>
                                        <div className={styles.modalityHeader}>
                                            <span className={styles.modalityIcon}>{modality.icon}</span>
                                            <span className={styles.modalityLabel}>{modality.label}</span>
                                            <div className={styles.statusDot} data-locked={locked}></div>
                                        </div>
                                        <button
                                            onClick={() => toggleLock('biometric', modality.value, locked)}
                                            disabled={loading}
                                            className={locked ? styles.btnUnlockSmall : styles.btnLockSmall}
                                        >
                                            {locked ? 'Unlock' : 'Lock'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lock History */}
            {authLocks.length > 0 && (
                <div className={styles.historySection}>
                    <h3>Lock History</h3>
                    <div className={styles.historyList}>
                        {authLocks.slice(0, 5).map((lock, index) => (
                            <div key={index} className={styles.historyItem}>
                                <div className={styles.historyInfo}>
                                    <span className={styles.historyType}>
                                        {lock.auth_type}
                                        {lock.biometric_modality && ` (${lock.biometric_modality})`}
                                    </span>
                                    <span className={styles.historyStatus} data-locked={lock.is_locked}>
                                        {lock.is_locked ? 'Locked' : 'Unlocked'}
                                    </span>
                                </div>
                                <div className={styles.historyTime}>
                                    {lock.is_locked
                                        ? `Locked: ${new Date(lock.locked_at).toLocaleString()}`
                                        : lock.unlocked_at
                                            ? `Unlocked: ${new Date(lock.unlocked_at).toLocaleString()}`
                                            : 'Never locked'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthenticationControls;
