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


import React, {useState, useEffect} from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import {useSnackbar} from "notistack";

import styles from "./ComponentList.module.css";
import {CopyToClipboard} from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import openExplorer from "../../utils/openExplorer";
import clientRequest from "../../services/clientRequest";
import FilterField from "../../components/FilterField";
import CopyIcon from "../../icons/CopyIcon";


function Component(props) {
  const {enqueueSnackbar} = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);

  const containerStyle = {
    borderColor: props.selectedComp && props.comp.filename === props.selectedComp.filename ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
  };

  const handleClick = e => {
    props.onSelect(e.currentTarget.id);
  };

  const handleCopy = (e, path) => {
    if (e) e.stopPropagation();
    CopyToClipboard(path, enqueueSnackbar);
  };

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
  ];

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
      });
    });
  };

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
  );
}

function ComponentList(props) {
  const [actions, setActions] = useState([]);
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    clientRequest("get_actions").then(resp => {
      setActions(resp.data.component || []);
    });
  }, [props.components]);

  return (
    <div className={styles.container}>
      <FilterField filterValue={filterValue} setFilterValue={setFilterValue} />
      <div className={styles.compList}>
        {props.components.map((comp, index) => {
          const filterString = `${comp.name}${comp.file}`;
          const hide = filterValue && !filterString.includes(filterValue);
          return <Component key={index} comp={comp}
            onSelect={props.onSelect} selectedComp={props.selectedComp}
            actions={actions} style={hide ? {display: "none"} : null}
          />;
        })}
      </div>
    </div>
  );
}

export default ComponentList;
