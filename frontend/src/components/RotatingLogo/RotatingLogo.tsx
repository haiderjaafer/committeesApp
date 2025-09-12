'use client';

import Image from 'next/image';
import styles from './logo.module.css';

export default function RotatingLogo() {
  return (
    <Image
      src="/slogan.gif"
      alt="Logo"
      width={35}
      height={35}
      style={{ width: 'auto', height: 'auto' }} // Maintain aspect ratio
      className={styles['rotate-infinite']}
    />
  );
}