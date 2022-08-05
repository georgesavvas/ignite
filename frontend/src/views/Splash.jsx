import { CircularProgress, Typography } from '@mui/material';
import React, {useState} from 'react';
import styles from "./Splash.module.css";
import CheckIcon from '@mui/icons-material/Check';
import { Box } from '@mui/system';
import { useEffect } from 'react';
import serverRequest from '../services/serverRequest';
import clientRequest from '../services/clientRequest';
// import { useSpring, animated } from 'react-spring';

export default function Splash(props) {
  const [serverProgress, setServerProgress] = useState(0);
  const [clientProgress, setClientProgress] = useState(0);
  const [frontendProgress, setFrontendProgress] = useState(0);
  const [opacity, setOpacity] = useState("100%");
  // const {serverSpring} = useSpring({ serverSpring: 100, from: { serverSpring: 0 }, config: { duration: 1000 } });
  // const {clientSpring} = useSpring({ clientSpring: 100, from: { clientSpring: 0 }, config: { duration: 1000 } });
  // const {frontendSpring} = useSpring({ frontendSpring: 100, from: { frontendSpring: 0 }, config: { duration: 1000 } });
  
  window.services.clientProgress((e, value) => {
    setClientProgress(value);
  })

  // useEffect(() => {
  //   const t1 = setTimeout(function () {
  //     setServerProgress(30);
  //     setClientProgress(50);
  //     setFrontendProgress(70);
  //   }, 1000);
  //   const t2 = setTimeout(function () {
  //     setServerProgress(100);
  //     setClientProgress(100);
  //     setFrontendProgress(100);
  //   }, 2000);
  // }, []);

  useEffect(() => {
    serverRequest("ping").then(resp => {
      if (resp.ok) setServerProgress(100);
    })
    clientRequest("ping").then(resp => {
      if (resp.ok) {
        setClientProgress(100);
        setFrontendProgress(100);
      }
    })
  })

  useEffect(() => {
    if (serverProgress + clientProgress + frontendProgress === 300) {
      const t3 = setTimeout(() => {
        setOpacity("0%");
        const t4 = setTimeout(() => {
          props.onFinished();
        }, 250);
      }, 1000);
    }
  }, [serverProgress, clientProgress, frontendProgress]);

  return(
    <div className={styles.container} style={{opacity: opacity}}>
      <div className={styles.logo} style={{backgroundImage: `url(media/logo_type.png)`}} />
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
          <Typography align="center" variant="h6">Server</Typography>
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
          <Typography align="center" variant="h6">Client</Typography>
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
          <Typography align="center" variant="h6">Data</Typography>
        </div>
      </div>
    </div>
  )
}
