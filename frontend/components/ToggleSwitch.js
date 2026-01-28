/**
 * Toggle Switch Component
 * Modern toggle switch for consent management
 */

import { useState } from 'react';
import styles from './ToggleSwitch.module.css';

export default function ToggleSwitch({
    label,
    checked = false,
    onChange,
    disabled = false
}) {
    const [isChecked, setIsChecked] = useState(checked);

    const handleToggle = () => {
        if (disabled) return;
        const newValue = !isChecked;
        setIsChecked(newValue);
        if (onChange) onChange(newValue);
    };

    return (
        <div className={styles.toggleContainer}>
            {label && <span className={styles.label}>{label}</span>}
            <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                className={`${styles.toggle} ${isChecked ? styles.checked : ''} ${disabled ? styles.disabled : ''}`}
                onClick={handleToggle}
                disabled={disabled}
            >
                <span className={styles.slider}></span>
            </button>
        </div>
    );
}
