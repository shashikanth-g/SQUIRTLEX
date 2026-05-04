// WaterSafetyAlert.jsx — Water safety advisory for contamination events
import React from 'react';
import styles from './WaterSafetyAlert.module.css';

export function WaterSafetyAlert({ severity, zone, status }) {
  if (!severity) return null;

  let message = '';
  let bgColor = '';
  let iconEmoji = '';

  if (severity === 'severe' || severity === 'critical') {
    message = '⚠️ DO NOT CONSUME WATER — Severe contamination detected. Use bottled water only.';
    bgColor = '#ff4444';
    iconEmoji = '🚫';
  } else if (severity === 'moderate' || severity === 'warning') {
    message = '⚠️ BOIL WATER ADVISORY — Water quality compromised. Boil before drinking.';
    bgColor = '#ffaa00';
    iconEmoji = '🔥';
  } else if (status === 'resolved' || status === 'safe') {
    message = '✅ Water quality restored. Water is safe for consumption.';
    bgColor = '#00cc00';
    iconEmoji = '💧';
  } else {
    return null;
  }

  return (
    <div className={styles.alert} style={{ backgroundColor: bgColor }}>
      <div className={styles.content}>
        <span className={styles.icon}>{iconEmoji}</span>
        <div className={styles.message}>
          <p>{message}</p>
          {zone && (
            <p className={styles.zone}>
              Affected Zone: <strong>{zone.name || zone.id}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default WaterSafetyAlert;
