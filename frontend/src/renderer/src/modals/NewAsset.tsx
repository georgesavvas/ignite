// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import ClearIcon from "@mui/icons-material/Clear";
import { Checkbox, FormControlLabel } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { EnqueueSnackbar } from "@renderer/types/common";
import { useContext, useEffect, useState } from "react";

import DynamicList from "../components/DynamicList";
import FileInput from "../components/FileInput";
import IgnTextField from "../components/IgnTextField";
import Modal from "../components/Modal";
import Tags from "../components/Tags";
import { ContextContext, ContextContextType } from "../contexts/ContextContext";
import clientRequest from "../services/clientRequest";
import styles from "./NewAsset.module.css";

type NewIgniteComponent = {
  name?: string;
  source?: string;
  sequence?: boolean;
  info?: {
    path?: string;
    sequence_expr?: string;
  };
};

interface NewAssetProps {
  droppedFiles?: File[];
  clearDroppedFiles?: () => void;
  enqueueSnackbar: EnqueueSnackbar;
  path?: string;
  open: boolean;
  onClose: () => void;
}

const NewAsset = (props: NewAssetProps) => {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [comps, setComps] = useState<NewIgniteComponent[]>([{}, {}]);
  const [tags, setTags] = useState<string[]>([]);
  const { currentContext, refresh } = useContext(ContextContext) as ContextContextType;

  useEffect(() => {
    if (!nameError || !name) return;
    setNameError(false);
  }, [name]);

  useEffect(() => {
    if (!props.droppedFiles) return;
    const fileList = [...props.droppedFiles];
    if (!fileList.length) return;
    setComps(fileList.map((file) => ({ name: file.name.split(".")[0], source: file.path })));
    if (props.clearDroppedFiles) props.clearDroppedFiles();
  }, [props.droppedFiles]);

  const reset = () => {
    setName("");
    setComps([{}, {}]);
    setTags([]);
  };

  const handleCompAdd = () => {
    setComps((prevState) => [...prevState, {}]);
  };

  const handleCompRemove = (index = -1) => {
    setComps((prevState) => {
      const dirs = [...prevState];
      if (index < 0) dirs.pop();
      else dirs.splice(index, 1);
      return dirs;
    });
  };

  const handleCreate = () => {
    if (!name) {
      setNameError(true);
      props.enqueueSnackbar("Asset name is required.", { variant: "error" });
      return;
    }
    const data = {
      name: name,
      comps: comps,
      tags: tags,
      task: props.path || currentContext.path,
    };
    clientRequest("ingest_asset", { data: data }).then((resp) => {
      if (resp.ok) {
        props.enqueueSnackbar("Asset created!", { variant: "success" });
        props.onClose();
        refresh();
        reset();
      } else {
        props.enqueueSnackbar("Failed to create asset.", { variant: "error" });
      }
    });
  };

  const handleCompChange = async (index: number, field: "name" | "source", value: string) => {
    let info: NewIgniteComponent["info"];
    if (field == "source" && value) {
      info = await clientRequest("process_filepath", { path: value }).then((resp) => resp.data);
    }
    setComps((prev) => {
      const existing = [...prev];
      const comp = existing[index];
      comp[field] = value;
      if (field == "source") {
        comp.info = info;
        handleCompSequence(comp);
      }
      return existing;
    });
  };

  const handleSequenceChange = (index: number, value: boolean) => {
    setComps((prev) => {
      const existing = [...prev];
      const comp = existing[index];
      comp.sequence = value;
      handleCompSequence(comp);
      return existing;
    });
  };

  const handleCompSequence = (comp: NewIgniteComponent) => {
    if (!comp.info) return comp;
    if (comp.sequence) comp.source = comp.info.sequence_expr;
    else comp.source = comp.info.path;
    return comp;
  };

  const handleTagsChange = (tags: string[]) => {
    console.log(tags);
    const processed = tags.map((tag) => tag.trim().replaceAll(/[^\w\s]+/g, "_"));
    console.log(processed);
    setTags(Array.from(new Set(processed)));
  };

  return (
    <Modal
      open={props.open}
      maxWidth="md"
      onClose={() => props.onClose()}
      style={{ minHeight: "50vh" }}
      title="New Asset"
      buttons={[
        <Button key="create" color="ignite" onClick={handleCreate}>
          Create
        </Button>,
      ]}
    >
      <div className={styles.container}>
        <div className={styles.firstRow}>
          <IgnTextField
            label="Asset name"
            value={name}
            error={nameError}
            onChange={(e) => setName(e.target.value)}
            style={{ minWidth: "300px", alignSelf: "flex-start" }}
          />
          <Tags tags={tags} onChange={handleTagsChange} />
        </div>
        <DynamicList title="Components" onAdd={handleCompAdd} onRemove={() => handleCompRemove(-1)}>
          {comps.map((comp, index) => (
            <div className={styles.compContainer} key={index}>
              <Box
                component={ClearIcon}
                onClick={() => handleCompRemove(index)}
                className={styles.removeIcon}
              />
              <div className={styles.compColumn}>
                <div className={styles.compRow}>
                  <IgnTextField
                    placeholder="Component name"
                    style={{ minWidth: "300px" }}
                    value={comp.name || ""}
                    onChange={(e) => handleCompChange(index, "name", e.target.value)}
                  />
                  <FormControlLabel
                    label="File sequence"
                    style={{ marginLeft: "0px" }}
                    control={
                      <Checkbox
                        checked={comp.sequence || false}
                        onChange={(e) => handleSequenceChange(index, e.target.checked)}
                      />
                    }
                  />
                </div>
                <div className={styles.compRow}>
                  <FileInput
                    placeholder="Source file"
                    buttonLabel="Browse"
                    style={{ minWidth: "300px" }}
                    fullWidth
                    size="small"
                    value={comp.source || ""}
                    onChange={(_: any, value: string) => handleCompChange(index, "source", value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </DynamicList>
      </div>
    </Modal>
  );
};

export default NewAsset;
