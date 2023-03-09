import { Button, Typography } from "@mui/material";
import React, { useState } from "react";
import Modal from "../../components/Modal";

import styles from "./SceneDrop.module.css";


const SceneDrop = props => {
  const [selected, setSelected] = useState();

  const handleConfirm = () => props.onClose(selected);

  const style = {
    border: "solid 2px rgb(0, 150, 0)"
  };

  return (
    <Modal
      maxWidth="xs"
      open={props.files?.length > 0}
      onClose={() => props.onClose()}
      title="Your dropped files contain one or more scenes"
      buttons={[
        <Button key="confirm"
          color="ignite"
          onClick={handleConfirm}
          disabled={!selected}
        >
          Confirm
        </Button>
      ]}
    >
      <Typography variant="subtitle1">
        Would you like to ingest one of them as an actual scene? Any remaining
        ones will carry over to the New Asset stage to be treated as components
      </Typography>
      <div className={styles.container}>
        {props.files?.map(file =>
          <div key={file.name}
            className={styles.file}
            style={selected === file.name ? style : null}
            onClick={() => setSelected(file.name)}
          >
            <Typography>
              {file.name}
            </Typography>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SceneDrop;
