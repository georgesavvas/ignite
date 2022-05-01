import React from 'react';
import styles from "./Output.module.css";
import DynamicList from "../../components/DynamicList";
import Typography from '@mui/material/Typography';

function Asset({data}) {
  return (
    <div className={styles.assetContainer}>
      <Typography variant="body1">{data.name}</Typography>
      {data.comps.map((comp) => 
        <div className={styles.compContainer}>
          <Typography variant="caption">{comp.name}</Typography>
          <Typography variant="caption">{comp.file}</Typography>
        </div>
      )}
    </div>
  )
}

function Output(props) {
  return (
    <div className={styles.container}>
      <Typography variant="h6">Output Preview</Typography>
      <DynamicList noButtons>
        {
          props.assets ?
          props.assets.map((child, index) => <Asset data={child} key={index} />) :
          null
        }
      </DynamicList>
    </div>
  )
}

export default Output;
