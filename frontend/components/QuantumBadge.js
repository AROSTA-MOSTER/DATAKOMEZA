/**
 * QuantumBadge Component
 * Hexagonal badge indicating quantum-safe security
 */

import styles from './QuantumBadge.module.css';

export default function QuantumBadge({ size = 'medium', label = 'Quantum-Safe' }) {
    return (
        <div className={`${styles.quantumBadge} ${styles[size]}`}>
            <div className={styles.hexagon}>
                <span className={styles.icon}>🔒</span>
            </div>
            {label && <span className={styles.label}>{label}</span>}
        </div>
    );
}
