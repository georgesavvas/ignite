import React from 'react';
import styles from "./Files.module.css";
import DynamicList from "../../components/DynamicList";
import Typography from '@mui/material/Typography';
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';

function File({filepath}) {
  return (
    <div className={styles.fileContainer}>
      <Typography variant="caption">{filepath}</Typography>
    </div>
  )
}

const handleFileInput = e => {
  window.api.fileInput().then(resp => {
    if (resp.cancelled) return;
    onFileSelected(e, resp.filePaths[0]);
  })
}

const onFileSelected = (e, filepath) => {
  const s = e.target.id.split("-");
  const target_id = s[1];
  const data = {
    index: target_id,
    field: "path",
    value: filepath
  }
  // setDccConfig(data, "modify");
}

function Files(props) {

  return (
    <div className={styles.container}>
      <Typography variant="h6">Incoming files</Typography>
      {/* <div className={styles.inputBar}> */}
      <TextField size="small" fullWidth multiline maxRows={5} placeholder="Paste files or directories..." onBlur={props.onDirsChange} />
        {/* <Button id={"file-browser"} variant="outlined" className={styles.browse} onClick={handleFileInput}>...</Button>
      </div> */}
      <DynamicList dense noButtons>
        {
          props.files ?
          props.files.map((child, index) => <File filepath={child} key={index} />) :
          null
        }
      </DynamicList>
    </div>
  )
}

export default Files;
