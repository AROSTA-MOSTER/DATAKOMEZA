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
            </Head>

            <div className={styles.container}>
                <div className={styles.authBox}>
                    <div className={styles.authHeader}>
                        <h1>Admin Portal</h1>
                        <p className="text-muted">Sign in to access the admin dashboard</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@datakomeza.org"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In as Admin'}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        <p className="text-muted">
                            <Link href="/">← Back to home</Link>
                        </p>
                    </div>

                    <div className={styles.sampleCredentials}>
                        <h4>Sample Admin Credentials</h4>
                        <p><strong>Email:</strong> admin@datakomeza.org</p>
                        <p><strong>Password:</strong> Admin@123</p>
                    </div>
                </div>
            </div>
        </>
    );
}
