// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, { useContext, useEffect, useState } from "react";

import styles from "./NewAsset.module.css";
import { Checkbox, Divider, FormControlLabel, IconButton, Link, Typography } from "@mui/material";
import {setProject, ContextContext} from "../../contexts/ContextContext";
import Modal from "../../components/Modal";
import IgnTextField from "../../components/IgnTextField";
import DynamicList from "../../components/DynamicList";
import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import clientRequest from "../../services/clientRequest";
import IgnButton from "../../components/IgnButton";
import TagContainer from "../DetailsView/TagContainer";


const NewAsset = props => {
  const [name, setName] = useState("");
  const [comps, setComps] = useState([{}, {}]);
  const [tags, setTags] = useState([]);

  const reset = () => {
    setName("");
    setComps([{}, {}]);
    setTags([]);
  };

  // useEffect(() => {
  //   if (props.open) return;
  //   reset();
  // }, [props.open]);

  const handleCompAdd = () => {
    setComps(prevState => [...prevState, {}]);
  };

  const handleCompRemove = (index=-1) => {
    setComps(prevState => {
      const dirs = [...prevState];
      if (index < 0) dirs.pop();
      else dirs.splice(index, 1);
      return dirs;
    });
  };

  const handleCreate = () => {
    const data = {
      name: name,
      comps: comps,
      tags: tags
    };
    clientRequest("ingest_asset", data).then(resp => {
      if (resp.ok) {
        props.enqueueSnackbar("Asset created!", {variant: "success"});
      } else {
        props.enqueueSnackbar("Failed to create asset.", {variant: "error"});
      }
      props.onClose();
      reset();
    });
  };

  const handleCompChange = (index, field, value) => {
    setComps(prev => {
      const existing = [...prev];
      existing[index][field] = value;
      return existing;
    });
  };

  const handleSequenceChange = (index, value) => {
    setComps(prev => {
      const existing = [...prev];
      existing[index].sequence = value;
      return existing;
    });
  };

  const handleAddTags = tags => {
    const processed = tags.split(",").map(tag => tag.trim());
    setTags(prev => Array.from(new Set(prev.concat(processed))));
  };

  const handleRemoveTag = tag => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSelectFile = async index => {
    const resp = await window.api.fileInput();
    if (resp.cancelled) return;
    const filePaths = resp.filePaths;
    if (!filePaths?.length) return;
    setComps(prev => {
      const existing = [...prev];
      existing[index]["file"] = filePaths[0];
      return existing;
    });
  };

  return (
    <Modal open={props.open} maxWidth="md" onClose={() => props.onClose()}
      style={{minHeight: "50vh"}}
      title="New Asset"
      buttons={[
        <Button key="create" color="ignite" onClick={handleCreate}>
          Create
        </Button>
      ]}
    >
      <div className={styles.container}>
        <IgnTextField
          label="Asset name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{minWidth: "300px", alignSelf: "flex-start"}}
        />
        <TagContainer
          tags={tags}
          onAdd={handleAddTags}
          onRemove={handleRemoveTag}
        />
        <DynamicList
          title="Components"
          onAdd={handleCompAdd}
          onRemove={() => handleCompRemove(-1)}
        >
          {comps.map((comp, index) =>
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
                    style={{minWidth: "300px"}}
                    value={comp.name || ""}
                    onChange={
                      e => handleCompChange(index, "name", e.target.value)
                    }
                  />
                  <FormControlLabel
                    label="File sequence"
                    style={{marginLeft: "0px"}}
                    control={
                      <Checkbox
                        checked={comp.sequence || false}
                        onChange={
                          e => handleSequenceChange(index, e.target.checked)
                        }
                      />
                    }
                  />
                </div>
                <div className={styles.compRow}>
                  <IgnTextField
                    placeholder="Source file"
                    style={{minWidth: "300px"}}
                    fullWidth
                    value={comp.file || ""}
                    onChange={
                      e => handleCompChange(index, "file", e.target.value)
                    }
                  />
                  <IgnButton onClick={() => handleSelectFile(index)}>
                    Browse
                  </IgnButton>
                </div>
              </div>
            </div>
          )}
        </DynamicList>
      </div>
    </Modal>
  );
};

export default NewAsset;
