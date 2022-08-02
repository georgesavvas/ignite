import { Typography } from '@mui/material';
import React from 'react';
import styles from "./Splash.module.css";

export default function Splash() {
  return(
    <div className={styles.container}>
      <div className={styles.logo} style={{backgroundImage: `url(media/logo_type.png)`}} />
      <Typography variant="h4">Loading</Typography>
    </div>
  )
}
