/**
 * Registration Page
 * New user registration form with professional design
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import FloatingParticles from '../components/FloatingParticles';
import QuantumBadge from '../components/QuantumBadge';
import styles from '../styles/Auth.module.css';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        pin: '',
        confirmPin: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        gender: '',
        nationality: '',
        fatherName: '',
        motherName: '',
        maritalStatus: '',
        currentAddress: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate PIN match
        if (formData.pin !== formData.confirmPin) {
            setError('PINs do not match');
            return;
        }

        // Validate PIN format
        if (!/^\d{6}$/.test(formData.pin)) {
            setError('PIN must be exactly 6 digits');
            return;
        }

        setLoading(true);

        const result = await register({
            email: formData.email,
            phone: formData.phone,
            pin: formData.pin,
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            placeOfBirth: formData.placeOfBirth,
            gender: formData.gender,
            nationality: formData.nationality,
            fatherName: formData.fatherName,
            motherName: formData.motherName,
            maritalStatus: formData.maritalStatus,
            currentAddress: formData.currentAddress
        });

        if (result.success) {
            router.push('/dashboard');
        } else {
            setError(result.message || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Register - DATAKOMEZA</title>
            </Head>

            <FloatingParticles />

            <div className={styles.registerContainer}>
                <div className={styles.registerCard}>
                    <div className={styles.registerIcon}>
                        <div className={styles.iconCircle}>
                            ✨
                        </div>
                    </div>

                    <h1 className={styles.registerTitle}>Create Your Identity</h1>
                    <p className={styles.registerSubtitle}>
                        Join the secure digital identity platform
                    </p>

                    <div className={styles.quantumBadgeWrapper}>
                        <QuantumBadge text="Quantum-Safe" size="small" />
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.registerForm}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    className={styles.glassInput}
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="First Name *"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    className={styles.glassInput}
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Last Name *"
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={styles.glassInput}
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email Address *"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className={styles.glassInput}
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone Number (Optional)"
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    className={styles.glassInput}
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <select
                                    id="gender"
                                    name="gender"
                                    className={styles.glassSelect}
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                id="nationality"
                                name="nationality"
                                className={styles.glassInput}
                                value={formData.nationality}
                                onChange={handleChange}
                                placeholder="Nationality (Optional)"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                id="placeOfBirth"
                                name="placeOfBirth"
                                className={styles.glassInput}
                                value={formData.placeOfBirth}
                                onChange={handleChange}
                                placeholder="Place of Birth"
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <input
                                    type="text"
                                    id="fatherName"
                                    name="fatherName"
                                    className={styles.glassInput}
                                    value={formData.fatherName}
                                    onChange={handleChange}
                                    placeholder="Father's Full Name"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <input
                                    type="text"
                                    id="motherName"
                                    name="motherName"
                                    className={styles.glassInput}
                                    value={formData.motherName}
                                    onChange={handleChange}
                                    placeholder="Mother's Full Name"
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <select
                                    id="maritalStatus"
                                    name="maritalStatus"
                                    className={styles.glassSelect}
                                    value={formData.maritalStatus}
                                    onChange={handleChange}
                                >
                                    <option value="">Marital Status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <input
                                    type="text"
                                    id="currentAddress"
                                    name="currentAddress"
                                    className={styles.glassInput}
                                    value={formData.currentAddress}
                                    onChange={handleChange}
                                    placeholder="Current Address"
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <input
                                    type="password"
                                    id="pin"
                                    name="pin"
                                    className={styles.glassInput}
                                    value={formData.pin}
                                    onChange={handleChange}
                                    placeholder="Create PIN (6 digits) *"
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <input
                                    type="password"
                                    id="confirmPin"
                                    name="confirmPin"
                                    className={styles.glassInput}
                                    value={formData.confirmPin}
                                    onChange={handleChange}
                                    placeholder="Confirm PIN *"
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.registerButton}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className={styles.registerFooter}>
                        <Link href="/login" className={styles.footerLink}>
                            Already have an account? Sign in
                        </Link>
                        <Link href="/" className={styles.footerLink}>
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
