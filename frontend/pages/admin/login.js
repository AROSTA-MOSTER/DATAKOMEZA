/**
 * Admin Login Page
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/Auth.module.css';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { adminLogin } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await adminLogin(email, password);

        if (result.success) {
            router.push('/admin/dashboard');
        } else {
            setError(result.message || 'Admin login failed');
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Admin Login - DATAKOMEZA</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    <div className={styles.logo}>
                        <div className={styles.logoText}>DATAKOMEZA</div>
                        <div className={styles.logoSubtext}>Admin Portal</div>
                        <div className={styles.quantumBadge}>
                            Post-Quantum Secured
                        </div>
                    </div>

                    <h2 className={styles.title}>Admin Login</h2>
                    <p className={styles.subtitle}>Sign in to access the admin dashboard</p>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@datakomeza.org"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In as Admin'
                            )}
                        </button>
                    </form>

                    <div className={styles.divider}>
                        <span className={styles.dividerText}>Demo Credentials</span>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '1rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.9)'
                    }}>
                        <p style={{ margin: '0.25rem 0' }}><strong>Email:</strong> admin@datakomeza.org</p>
                        <p style={{ margin: '0.25rem 0' }}><strong>Password:</strong> Admin@123</p>
                    </div>

                    <div className={styles.link}>
                        <Link href="/" className={styles.linkButton}>
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
