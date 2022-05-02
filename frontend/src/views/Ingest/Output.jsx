import React from 'react';
import styles from "./Output.module.css";
import DynamicList from "../../components/DynamicList";
import Typography from '@mui/material/Typography';
import {useXarrow} from "react-xarrows";
import { Divider } from '@mui/material';

function Asset({data, id}) {
  return (
    <div className={styles.assetContainer}>
      <Typography variant="h6">{data.name}</Typography>
      <Typography variant="caption">Ingest in: {data.task}</Typography>
      <Divider textAlign="left" sx={{margin: "5px 0 5px 0"}}>Components</Divider>
      {data.comps.map((comp, index) => 
        <div className={styles.compContainer} key={index}>
          <Typography variant="caption">{comp.name}</Typography>
          <Typography variant="caption">{comp.file}</Typography>
        </div>
      )}
      <div className={styles.connector} id={id} />
    </div>
  )
}

function Output(props) {
  const updateXarrow = useXarrow();

  return (
    <div className={styles.container}>
      <Typography variant="h6">Output Preview</Typography>
      <DynamicList noButtons onScroll={updateXarrow} style={{marginTop: "34px"}}>
        {
          props.assets ?
          props.assets.map((child, index) => <Asset data={child} key={index} id={"asset-" + index} />) :
          null
        }
      </DynamicList>
    </div>
  )
}

export default Output;
