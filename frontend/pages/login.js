/**
 * Login Page
 * User authentication with email/phone and PIN
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import FloatingParticles from '../components/FloatingParticles';
import QuantumBadge from '../components/QuantumBadge';
import styles from '../styles/Auth.module.css';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(identifier, pin);

        if (result.success) {
            router.push('/dashboard');
        } else {
            setError(result.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Login - DATAKOMEZA</title>
            </Head>

            <FloatingParticles />

            <div className={styles.loginContainer}>
                <div className={styles.loginCard}>
                    <div className={styles.lockIcon}>
                        <div className={styles.lockCircle}>
                            🔒
                        </div>
                    </div>

                    <h1 className={styles.loginTitle}>DATAKOMEZA</h1>

                    <div className={styles.quantumBadgeWrapper}>
                        <QuantumBadge text="Quantum-Safe" size="small" />
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.loginForm}>
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                id="identifier"
                                className={styles.glassInput}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Email"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <input
                                type="password"
                                id="pin"
                                className={styles.glassInput}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="PIN"
                                maxLength="6"
                                pattern="[0-9]{6}"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.signInButton}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className={styles.loginFooter}>
                        <Link href="/register" className={styles.footerLink}>
                            Don't have an account? Register
                        </Link>
                        <Link href="/" className={styles.footerLink}>
                            ← Back to home
                        </Link>
                    </div>
                </div>

                {/* Sample credentials hint */}
                <div className={styles.sampleHint}>
                    <p><strong>Test:</strong> refugee@test.com / 123456</p>
                </div>
            </div>
        </>
    );
}
