import { CircularProgress, Typography } from '@mui/material';
import React, {useState} from 'react';
import styles from "./Splash.module.css";
import CheckIcon from '@mui/icons-material/Check';
import { Box } from '@mui/system';

export default function Splash() {
  const [serverProgress, setServerProgress] = useState(33);
  const [clientProgress, setClientProgress] = useState(66);
  const [frontendProgress, setFrontendProgress] = useState(100);

  return(
    <div className={styles.container}>
      <div className={styles.logo} style={{backgroundImage: `url(media/logo_type.png)`}} />
      {/* <Typography variant="h6">Loading</Typography> */}
      <div className={styles.loadingContainer}>
        <div>
          <div className={styles.loading}>
            <CircularProgress
              size={70}
              color={serverProgress < 100 ? "info" : "success"}
              variant="determinate"
              value={serverProgress}
            />
            <Box className={styles.loadingContext}>
              {serverProgress < 100 ?
                <Typography align="center" variant="h6">{serverProgress}%</Typography> :
                <CheckIcon fontSize="large" color="success" />
              }
            </Box>
          </div>
          <Typography align="center">Server</Typography>
        </div>
        <div>
          <div className={styles.loading}>
            <CircularProgress
              size={70}
              color={clientProgress < 100 ? "info" : "success"}
              variant="determinate"
              value={clientProgress}
            />
            <Box className={styles.loadingContext}>
              {clientProgress < 100 ?
                <Typography align="center" variant="h6">{clientProgress}%</Typography> :
                <CheckIcon fontSize="large" color="success" />
              }
            </Box>
          </div>
          <Typography align="center">Client</Typography>
        </div>
        <div>
          <div className={styles.loading}>
            <CircularProgress
              size={70}
              color={frontendProgress < 100 ? "info" : "success"}
              variant="determinate"
              value={frontendProgress}
            />
            <Box className={styles.loadingContext}>
              {frontendProgress < 100 ?
                <Typography align="center" variant="h6">{frontendProgress}%</Typography> :
                <CheckIcon fontSize="large" color="success" />
              }
            </Box>
          </div>
          <Typography align="center">Data</Typography>
        </div>
      </div>
    </div>
  )
}
