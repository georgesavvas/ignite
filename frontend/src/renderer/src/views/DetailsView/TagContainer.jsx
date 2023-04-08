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


import React, {useState, useRef, useContext} from "react";

import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import stc from "string-to-color";
import { TextField, Typography, Button } from "@mui/material";
import {useSnackbar} from "notistack";
import Tooltip from "@mui/material/Tooltip";

import {hexToHsl} from "../../utils/hexToHsl";
import {CopyToClipboard} from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import styles from "./TagContainer.module.css";
import Modal from "../../components/Modal";
import DataPlaceholder from "../../components/DataPlaceholder";
import BuildFileURL from "../../services/BuildFileURL";
import {ConfigContext} from "../../contexts/ConfigContext";
import serverRequest from "../../services/serverRequest";
import {ContextContext} from "../../contexts/ContextContext";


const namedStyles = {
  locked: {
    backgroundColor: "rgb(40, 40, 100)"
  },
  approved: {
    backgroundColor: "rgb(40,100,40)"
  },
  deprecated: {
    backgroundColor: "rgb(5, 5, 5)"
  }
};

export function TagContainer(props) {
  const [newTagsOpen, setNewTagsOpen] = useState(false);
  const [newTags, setNewTags] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [config] = useContext(ConfigContext);
  const [,, refreshContext] = useContext(ContextContext);
  const {enqueueSnackbar} = useSnackbar();
  const newTagsRef = useRef();

  const contextItems = [
    {
      label: "Copy tags",
      fn: () =>  CopyToClipboard(props.tags, enqueueSnackbar)
    },
    {
      label: "Add tags",
      fn: () => {
        setNewTags("");
        setNewTagsOpen(true);
      }
    }
  ];

  const handleAddTags = () => {
    if (props.onAdd) {
      props.onAdd(newTags);
      setNewTagsOpen(false);
      return;
    }
    const data = {
      path: BuildFileURL(
        props.entityPath, config,
        {pathOnly: true, reverse: true}
      ),
      tags: newTags
    };
    serverRequest("add_tags", data).then(() => refreshContext());
    setNewTagsOpen(false);
  };

  const handleRemoveTag = tag => {
    if (props.onRemove) {
      props.onRemove(tag);
      setNewTagsOpen(false);
      return;
    }
    const data = {
      path: BuildFileURL(
        props.entityPath, config, {pathOnly: true, reverse: true}
      ),
      tags: tag
    };
    serverRequest("remove_tags", data).then(() => refreshContext());
    props.onRemove(tag);
  };

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <Modal open={newTagsOpen} onClose={() => setNewTagsOpen(false)}
        maxWidth="md"
        buttons={[<Button key="create" type="submit">Create</Button>]}
        title="Add Tags" onFormSubmit={handleAddTags} focusRef={newTagsRef}
      >
        <TextField onChange={e => setNewTags(e.target.value)} value={newTags} 
          size="small" fullWidth autoFocus inputRef={newTagsRef}
        />
        <Typography variant="caption">
        Multiple tags can be separated by commas
        </Typography>
      </Modal>
      <div className={styles.container}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}>
        {props.tags.map((tag, index) => <Tag name={tag} key={index}
          onDelete={() => handleRemoveTag(tag)}
        />)}
        <NewTags add onClick={() => {setNewTags(""); setNewTagsOpen(true);}} />
        {!props.tags.length ?
          <DataPlaceholder text="No tags" style={{padding: 0}} variant="h5" />
          : null
        }
      </div>
    </>
  );
}

function Tag(props) {
  let style = {};
  if (namedStyles[props.name]) style = namedStyles[props.name];
  else style = {backgroundColor: hexToHsl(stc(props.name), 80, 30)};

  const limit = 30;
  const nameFormatted = props.name.length < limit ?
    props.name :
    props.name.substring(0, limit) + "...";

  return (
    <div className={styles.tag} style={style}>
      <Typography>{nameFormatted}</Typography>
      <ClearIcon
        className={styles.clearIcon}
        onClick={() => props.onDelete(props.name)}
      />
    </div>
  );
}

function NewTags(props) {
  return (
    <Tooltip title="Add Tags">
      <div onContextMenu={e => {e.preventDefault(); e.stopPropagation();}}
        className={styles.tagEdit} onClick={props.onClick}
      >
        <AddIcon />
      </div>
    </Tooltip>
  );
}

export default TagContainer;
