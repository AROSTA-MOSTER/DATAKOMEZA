/**
 * Registration Page
 * New user registration form
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
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
        gender: '',
        nationality: ''
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
            gender: formData.gender,
            nationality: formData.nationality
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

            <div className={styles.container}>
                <div className={styles.authBox}>
                    <div className={styles.authHeader}>
                        <h1>Create Your Identity</h1>
                        <p className="text-muted">Register for secure digital identity</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className="grid grid-2 gap-2">
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    className="form-input"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    className="form-input"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className="form-input"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+250788123456"
                            />
                        </div>

                        <div className="grid grid-2 gap-2">
                            <div className="form-group">
                                <label htmlFor="dateOfBirth" className="form-label">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    className="form-input"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="gender" className="form-label">
                                    Gender
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    className="form-select"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="nationality" className="form-label">
                                Nationality
                            </label>
                            <input
                                type="text"
                                id="nationality"
                                name="nationality"
                                className="form-input"
                                value={formData.nationality}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-2 gap-2">
                            <div className="form-group">
                                <label htmlFor="pin" className="form-label">
                                    Create PIN (6 digits) *
                                </label>
                                <input
                                    type="password"
                                    id="pin"
                                    name="pin"
                                    className="form-input"
                                    value={formData.pin}
                                    onChange={handleChange}
                                    placeholder="••••••"
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPin" className="form-label">
                                    Confirm PIN *
                                </label>
                                <input
                                    type="password"
                                    id="confirmPin"
                                    name="confirmPin"
                                    className="form-input"
                                    value={formData.confirmPin}
                                    onChange={handleChange}
                                    placeholder="••••••"
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        <p className="text-muted">
                            Already have an account?{' '}
                            <Link href="/login">Sign in here</Link>
                        </p>
                        <p className="text-muted">
                            <Link href="/">← Back to home</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
