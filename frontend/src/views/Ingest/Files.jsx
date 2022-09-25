import React from "react";

import Typography from "@mui/material/Typography";
import {useXarrow} from "react-xarrows";

import styles from "./Files.module.css";
import FileInput from "../../components/FileInput";
import DynamicList from "../../components/DynamicList";


function File({filepath, id}) {
  return (
    <div className={styles.fileContainer}>
      <Typography variant="caption">{filepath}</Typography>
      <div className={styles.connector} id={id} />
    </div>
  );
}

function Files(props) {
  const updateXarrow = useXarrow();

  return (
    <div className={styles.container}>
      <Typography variant="h6">Incoming files</Typography>
      <FileInput size="small" fullWidth multiline maxRows={5} placeholder="Paste files or directories..."
        onChange={props.onDirsChange} style={{alignSelf: "stretch"}}
      />
      <DynamicList dense noButtons onScroll={updateXarrow}>
        {
          props.files ?
            props.files.map((child, index) => <File filepath={child} key={index} id={"file-" + index} />) :
            null
        }
      </DynamicList>
    </div>
  );
}

export default Files;
