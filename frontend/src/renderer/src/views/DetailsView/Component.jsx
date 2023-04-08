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


import React, {useState} from "react";
import styles from "./Component.module.css";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import {useSnackbar} from "notistack";
import {EXTENSIONTYPES} from "../../constants";
import clientRequest from "../../services/clientRequest";
import CopyIcon from "../../icons/CopyIcon";
import {CopyToClipboard} from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import openExplorer from "../../utils/openExplorer";


function Component(props) {
  const {enqueueSnackbar} = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);

  const containerStyle = {
    borderColor: props.selectedComp && props.entity.filename === props.selectedComp.filename ? "rgb(252, 140, 3)" : "rgb(70,70,70)"
  };

  const handleClick = e => {
    props.onSelect(e.currentTarget.id);
  };

  const handleCopy = (e, path) => {
    if (e) e.stopPropagation();
    CopyToClipboard(path, enqueueSnackbar);
  };

  const dirData = {
    kind: props.entity.dir_kind,
    path: props.entity.path,
    name: props.entity.name
  };

  let contextItems = [
    {
      label: "Copy path",
      fn: () => handleCopy(undefined, props.entity.path)
    },
    {
      label: "Copy URI",
      fn: () => handleCopy(undefined, props.entity.uri),
      divider: true
    },
    {
      label: "Open in file explorer",
      fn: () => openExplorer(props.entity.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Add to crate",
      fn: () => props.addToCrate([props.entity]),
      divider: true
    },
    {
      label: "Rename",
      fn: () => props.handleContextMenuSelection("rename", dirData),
      disabled: props.entity.protected
    },
    {
      label: "Delete",
      fn: () => props.handleContextMenuSelection("delete", dirData),
      disabled: props.entity.protected,
      divider: true
    }
  ];

  const data = {
    kind: "component",
    entity: props.entity
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

  if (props.actions) {
    contextItems = contextItems.concat(
      Object.values(props.actions).map(action => (
        {
          label: action.label,
          fn: () => handleAction(action)
        }
      ))
    );
  }

  const getIconStyle = () => {
    const style = {};
    const extType = EXTENSIONTYPES.find(ext =>
      ext.extensions.includes(props.entity.ext)
    );
    const iconName = extType?.name || "file.png";
    style.backgroundImage = `url(src/assets/components/${iconName})`;
    return style;
  };

  return (
    <div onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
      style={props.style}
    >
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu} title={props.entity.name}
        subtitle={props.entity.ext}
      />
      <div className={styles.compContainer} id={props.entity.filename}
        onClick={handleClick} style={containerStyle}
      >
        <div className={styles.compIcon} style={getIconStyle()} />
        <div className={styles.textContainer}>
          <Typography variant="subtitle1" className={styles.label}>
            {props.entity.filename}
          </Typography>
        </div>
        <div className={styles.spacer} />
        <IconButton onClick={e => handleCopy(e, props.entity.path)}>
          <CopyIcon style={{fontSize: "20px"}} />
        </IconButton>
      </div>
    </div>
  );
}

export default Component;
