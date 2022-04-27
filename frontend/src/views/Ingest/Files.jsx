import React from 'react';
import styles from "./Files.module.css";
import DynamicList from "../../components/DynamicList";
import Typography from '@mui/material/Typography';

function File(filepath) {
  return (
    <div className={styles.fileContainer}>
      <Typography variant="caption">{filepath}</Typography>
    </div>
  )
}

function Files(props) {
  return (
    <div className={styles.container}>
      <Typography variant="h6">Incoming files</Typography>
      <DynamicList dense>
        {
          props.data ?
          props.data.map((child) => File(child)) :
          null
        }
      </DynamicList>
    </div>
  )
}

export default Files;
