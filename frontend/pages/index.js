/**
 * Home Page
 * Landing page for DATAKOMEZA platform
 */

import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            if (user?.isAdmin) {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard');
            }
        }
    }, [isAuthenticated, user, router]);

    return (
        <>
            <Head>
                <title>DATAKOMEZA - Digital Identity for Refugees</title>
                <meta name="description" content="Privacy-preserving digital identity platform for refugees and asylum seekers in Africa" />
            </Head>

            <div className={styles.container}>
                {/* Hero Section */}
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            <span className={styles.gradient}>DATAKOMEZA</span>
                            <br />
                            Digital Identity for Refugees
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Secure, privacy-preserving digital identity platform for refugees and asylum seekers in Africa.
                            Access healthcare, education, and humanitarian services with confidence.
                        </p>
                        <div className={styles.heroActions}>
                            <Link href="/register" className="btn btn-primary btn-lg">
                                Get Started
                            </Link>
                            <Link href="/login" className="btn btn-secondary btn-lg">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className={styles.features}>
                    <h2 className="text-center mb-3">Why Choose DATAKOMEZA?</h2>
                    <div className="grid grid-3 gap-2">
                        <div className="card">
                            <div className={styles.featureIcon}>🔒</div>
                            <h3>Privacy First</h3>
                            <p className="text-muted">
                                End-to-end encryption ensures your sensitive data remains private and secure.
                            </p>
                        </div>
                        <div className="card">
                            <div className={styles.featureIcon}>🤝</div>
                            <h3>Consent-Based</h3>
                            <p className="text-muted">
                                You control what information you share and with whom. Revoke access anytime.
                            </p>
                        </div>
                        <div className="card">
                            <div className={styles.featureIcon}>📱</div>
                            <h3>Offline Ready</h3>
                            <p className="text-muted">
                                QR code and PIN-based authentication works even without internet connection.
                            </p>
                        </div>
                        <div className="card">
                            <div className={styles.featureIcon}>🏥</div>
                            <h3>Healthcare Access</h3>
                            <p className="text-muted">
                                Securely share medical information with healthcare providers.
                            </p>
                        </div>
                        <div className="card">
                            <div className={styles.featureIcon}>📚</div>
                            <h3>Education Services</h3>
                            <p className="text-muted">
                                Access educational programs and vocational training opportunities.
                            </p>
                        </div>
                        <div className="card">
                            <div className={styles.featureIcon}>🌍</div>
                            <h3>Humanitarian Aid</h3>
                            <p className="text-muted">
                                Connect with NGOs and humanitarian organizations for assistance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className={styles.howItWorks}>
                    <h2 className="text-center mb-3">How It Works</h2>
                    <div className={styles.steps}>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>1</div>
                            <h3>Register</h3>
                            <p>Create your digital identity with minimal personal information</p>
                        </div>
                        <div className={styles.stepArrow}>→</div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>2</div>
                            <h3>Control</h3>
                            <p>Manage your data and grant consent to service providers</p>
                        </div>
                        <div className={styles.stepArrow}>→</div>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>3</div>
                            <h3>Access</h3>
                            <p>Use QR code or PIN to access essential services securely</p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className={styles.cta}>
                    <div className="card">
                        <h2>Ready to Get Started?</h2>
                        <p className="text-muted mb-2">
                            Join thousands of refugees who have already secured their digital identity with DATAKOMEZA.
                        </p>
                        <Link href="/register" className="btn btn-primary btn-lg">
                            Create Your Identity
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className={styles.footer}>
                    <div className={styles.footerContent}>
                        <div>
                            <h4>DATAKOMEZA</h4>
                            <p className="text-muted">Privacy-preserving digital identity for refugees</p>
                        </div>
                        <div className={styles.footerLinks}>
                            <Link href="/about">About</Link>
                            <Link href="/privacy">Privacy Policy</Link>
                            <Link href="/terms">Terms of Service</Link>
                            <Link href="/admin/login">Admin Login</Link>
                        </div>
                    </div>
                    <div className={styles.footerBottom}>
                        <p className="text-muted">© 2026 DATAKOMEZA. Built with ❤️ for refugees in Africa.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
