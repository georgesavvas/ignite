import LoadingButton from "@mui/lab/LoadingButton";
import { Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";

import Modal from "../../components/Modal";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import clientRequest from "../../services/clientRequest";
import styles from "./SceneDrop.module.css";

interface SceneDropProps {
  files: {
    all: File[];
    scenes: File[];
  };
  onClose: (files?: File[]) => void;
}

const SceneDrop = (props: IgniteSceneDropProps) => {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { currentContext, refresh } = useContext(ContextContext) as ContextContextType;

  useEffect(() => {
    setLoading(false);
    setSelected("");
  }, [props.files]);

  if (!props.files?.scenes) return null;

  const ingestScene = (scenePath: string) => {
    const data = {
      scene: IgniteScenePath,
      task: currentContext.path,
    };
    clientRequest("ingest_scene", { data: data }).then((resp) => {
      if (resp.ok) {
        enqueueSnackbar("Scene created!", { variant: "success" });
      } else {
        enqueueSnackbar("Failed to create scene.", { variant: "error" });
      }
      refresh();
    });
  };

  const handleConfirm = () => {
    setLoading(true);
    const files = [...props.files.all];
    if (!files || !files.length) {
      props.onClose();
      return;
    }
    const index = files.findIndex((file) => file.name === selected);
    if (index < -1) {
      props.onClose();
      return;
    }
    const scene = files.splice(index, 1)[0];
    ingestScene(scene.path);
    props.onClose(files);
  };

  const style = {
    border: "solid 2px rgb(0, 150, 0)",
  };

  return (
    <Modal
      maxWidth="xs"
      open={props.files?.scenes.length > 0}
      onClose={() => props.onClose()}
      title="Your dropped files contain one or more scenes"
      buttons={[
        <LoadingButton key="confirm" loading={loading} color="ignite" onClick={handleConfirm}>
          Confirm
        </LoadingButton>,
      ]}
    >
      <Typography variant="subtitle1">
        Would you like to ingest one of them as an actual scene? Any remaining ones will carry over
        to the New Asset stage to be treated as components
      </Typography>
      <div className={styles.container}>
        <div className={styles.file} style={!selected ? style : {}} onClick={() => setSelected("")}>
          <Typography>None</Typography>
        </div>
        {props.files?.scenes.map((file) => (
          <div
            key={file.name}
            className={styles.file}
            style={selected === file.name ? style : {}}
            onClick={() => setSelected(file.name)}
          >
            <Typography>{file.name}</Typography>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default SceneDrop;
