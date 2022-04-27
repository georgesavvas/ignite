import React from 'react';
import styles from "./Output.module.css";
import DynamicList from "../../components/DynamicList";
import Typography from '@mui/material/Typography';

function Asset(data) {
  return (
    <div className={styles.assetContainer}>
      <Typography variant="body1">{data.name}</Typography>
      {data.comps.map((comp) => <Typography variant="caption">{comp.file}</Typography>)}
    </div>
  )
}
function Output(props) {
  return (
    <div className={styles.container}>
      <Typography variant="h6">Output Preview</Typography>
      <DynamicList>
        {
          props.data ?
          props.data.map((child) => Asset(child)) :
          null
        }
      </DynamicList>
    </div>
  )
}

export default Output;
