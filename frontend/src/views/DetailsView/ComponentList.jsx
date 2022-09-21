import React, { useState, useEffect, useContext } from "react";
import styles from "./ComponentList.module.css";
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CopyIcon from "../../icons/CopyIcon";
import { useSnackbar } from 'notistack';
import { CopyToClipboard } from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import openExplorer from "../../utils/openExplorer";
import clientRequest from "../../services/clientRequest";
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';

const dccNames = {
  houdini: ["hmaster", "hescape", "houdini", "houdinicore", "houdinifx"],
  maya: ["maya"],
  blender: ["blender"],
  nuke: ["nuke"]
}

function Component(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);

  const containerStyle = {
    borderColor: props.comp.filename === props.selectedComp.filename ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
  }

  const handleClick = e => {
    props.onSelect(e.currentTarget.id);
  }

  const handleCopy = (e, path) => {
    if (e) e.stopPropagation();
    CopyToClipboard(path, enqueueSnackbar);
  }

  let contextItems = [
    {
      label: "Copy path",
      fn: () => handleCopy(undefined, props.comp.path),
      divider: true
    },
    {
      label: "Open in file explorer",
      fn: () => openExplorer(props.comp.path, enqueueSnackbar),
      divider: true
    },
  ]

  const data = {
    kind: "component",
    entity: props.comp
  };

  const handleAction = action => {
    window.services.get_env("IGNITE_SESSION_ID").then(resp => {
      clientRequest("run_action", {
        ...data,
        action: action.label,
        session_id: resp
      })
    })
  }

  contextItems = contextItems.concat(props.actions.map(action => (
    {
      label: action.label,
      fn: () => handleAction(action)
    }
  )));

  return (
    <div onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)} style={props.style}>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div className={styles.compContainer} id={props.comp.filename} onClick={handleClick} style={containerStyle}>
        <div className={styles.compIcon} />
        <div className={styles.textContainer}>
          <Typography variant="subtitle1" className={styles.label}>{props.comp.filename}</Typography>
        </div>
        <div className={styles.spacer} />
        <IconButton onClick={e => handleCopy(e, props.comp.path)}>
          <CopyIcon style={{fontSize: "20px"}} />
        </IconButton>
      </div>
    </div>
  )
}

function ComponentList(props) {
  const [actions, setActions] = useState([]);
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    clientRequest("get_actions").then(resp => {
      setActions(resp.data.component || []);
    })
  }, [])

  return (
    <div className={styles.container}>
      {/* <Typography variant="h5" style={{marginBottom: "10px"}}>Components</Typography> */}
      <div className={styles.filterBar}>
        <FormControl fullWidth focused={filterValue ? true : false}>
          <OutlinedInput
            id="outlined-basic"
            size="small"
            fullWidth
            placeholder="Filter"
            value={filterValue}
            onChange={e => setFilterValue(e.target.value || "")}
            color={filterValue ? "error" : ""}
          />
        </FormControl>
      </div>
      <div className={styles.compList}>
        {props.components.map((comp, index) => {
          const filterString = `${comp.name}${comp.file}`;
          const hide = filterValue && !filterString.includes(filterValue);
          return <Component key={index} comp={comp}
            onSelect={props.onSelect} selectedComp={props.selectedComp}
            actions={actions} style={hide ? {display: "none"} : null}
          />
        })}
      </div>
    </div>
  )
}

export default ComponentList;
