import React, { useState, useContext } from 'react'
import styles from "./TagContainer.module.css";
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { TextField, Typography } from '@mui/material';
import Modal from "../../components/Modal";
import { useSnackbar } from 'notistack';
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import Tooltip from '@mui/material/Tooltip';
import { hexToHsl } from '../../utils/hexToHsl';
import { ConfigContext } from "../../contexts/ConfigContext";
import {ContextContext} from "../../contexts/ContextContext";
import serverRequest from "../../services/serverRequest";
import BuildFileURL from "../../services/BuildFileURL";
const stc = require("string-to-color");

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
}

export function TagContainer(props) {
  const [newTagsOpen, setNewTagsOpen] = useState(false);
  const [newTagsName, setNewTagsName] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [config, setConfig] = useContext(ConfigContext);
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const contextItems = [
    {
      label: "Copy tag",
      fn: () =>  CopyToClipboard(props.name, enqueueSnackbar)
    },
    {
      label: "Remove tag",
      fn: () => {}
    }
  ]

  const handleAddTags = e => {
    const data = {
      path: BuildFileURL(props.entityPath, config, {pathOnly: true, reverse: true}),
      tags: newTagsName
    };
    serverRequest("add_tags", data).then(resp => {
      if (resp.ok) console.log("done");
      else console.log("failed");
      refreshContext();
    })
    setNewTagsOpen(false);
  }

  const handleRemoveTags = tags => {
    const data = {
      path: BuildFileURL(props.entityPath, config, {pathOnly: true, reverse: true}),
      tags: tags
    };
    serverRequest("remove_tags", data).then(resp => {
      if (resp.ok) console.log("done");
      else console.log("failed");
      refreshContext();
    })
    setNewTagsOpen(false);
  }

  return (
    <>
    <ContextMenu items={contextItems} contextMenu={contextMenu}
      setContextMenu={setContextMenu}
    />
    <Modal open={newTagsOpen} onClose={() => setNewTagsOpen(false)} maxWidth="md"
      closeButton onButtonClicked={handleAddTags} buttonLabel="Create"
      title="Add Tags" 
    >
      <TextField onChange={e => setNewTagsName(e.target.value)} value={newTagsName} 
        size="small" fullWidth autoFocus
      />
      <Typography variant="caption">
        Multiple tags can be separated by commas
      </Typography>
    </Modal>
    <div className={styles.container}
      onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}>
      {props.tags.map((tag, index) => <Tag name={tag} key={index}
        onDelete={() => handleRemoveTags(tag)}
      />)}
      <NewTags add onClick={() => {setNewTagsName(""); setNewTagsOpen(true);}} />
    </div>
    </>
  )
}

function Tag(props) {
  const [isHovered, setIsHovered] = useState(false);

  let style = {};
  if (namedStyles.hasOwnProperty(props.name)) style = namedStyles[props.name];
  else style = {backgroundColor: hexToHsl(stc(props.name), 80, 30)};

  const limit = 30;
  const nameFormatted = props.name.length < limit ?
    props.name :
    props.name.substring(0, limit) + "...";

  return (
    <div className={styles.tag} style={style}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
    >
      <Typography>{nameFormatted}</Typography>
      {isHovered && !props.add ?
        <ClearIcon
          style={{cursor: "pointer"}}
          onClick={() => props.onDelete(props.name)}
        /> :
        null
      }
    </div>
  )
}

function NewTags(props) {
  return (
    <Tooltip title="Add Tags">
      <div className={styles.tagEdit} onClick={props.onClick} >
        <AddIcon />
      </div>
    </Tooltip>
  )
}

export default TagContainer;
