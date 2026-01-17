/**
 * Login Page
 * User authentication with email/phone and PIN
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
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

            <div className={styles.container}>
                <div className={styles.authBox}>
                    <div className={styles.authHeader}>
                        <h1>Welcome Back</h1>
                        <p className="text-muted">Sign in to access your digital identity</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className="form-group">
                            <label htmlFor="identifier" className="form-label">
                                Email or Phone Number
                            </label>
                            <input
                                type="text"
                                id="identifier"
                                className="form-input"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="amina.refugee@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="pin" className="form-label">
                                PIN (6 digits)
                            </label>
                            <input
                                type="password"
                                id="pin"
                                className="form-input"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="••••••"
                                maxLength="6"
                                pattern="[0-9]{6}"
                                required
                            />
                            <small className="text-muted">Enter your 6-digit PIN</small>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        <p className="text-muted">
                            Don't have an account?{' '}
                            <Link href="/register">Register here</Link>
                        </p>
                        <p className="text-muted">
                            <Link href="/">← Back to home</Link>
                        </p>
                    </div>

                    <div className={styles.sampleCredentials}>
                        <h4>Sample Credentials</h4>
                        <p><strong>Email:</strong> amina.refugee@example.com</p>
                        <p><strong>PIN:</strong> 123456</p>
                    </div>
                </div>
            </div>
        </>
    );
}
