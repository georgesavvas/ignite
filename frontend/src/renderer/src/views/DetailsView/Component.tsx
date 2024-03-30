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

import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { CrateContext, CrateContextType } from "@renderer/contexts/CrateContext";
import { ClickEvent, IgniteAction, IgniteActions, IgniteComponent } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import React, { useContext, useState } from "react";

import ContextMenu, { ContextMenuType, handleContextMenu } from "../../components/ContextMenu";
import { EXTENSIONTYPES } from "../../constants/extensionTypes";
import CopyIcon from "../../icons/CopyIcon";
import clientRequest from "../../services/clientRequest";
import openExplorer from "../../utils/openExplorer";
import { CopyToClipboard } from "../ContextActions";
import styles from "./Component.module.css";

interface ComponentProps {
  selectedComp?: IgniteComponent;
  entity: IgniteComponent;
  onSelect?: (name: string) => void;
  actions?: IgniteActions;
  handleContextMenuSelection?: (action: string, data: any) => void;
  style?: React.CSSProperties;
}

const Component = (props: ComponentProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { addToCrate } = useContext(CrateContext) as CrateContextType;
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);

  const containerStyle = {
    borderColor:
      props.selectedComp && props.entity.filename === props.selectedComp.filename
        ? "rgb(252, 140, 3)"
        : "rgb(70,70,70)",
  };

  const handleClick = (e: ClickEvent) => {
    if (props.onSelect) props.onSelect(e.currentTarget.id);
  };

  const handleCopy = (e: ClickEvent | undefined, path: string) => {
    if (e) e.stopPropagation();
    CopyToClipboard(path, enqueueSnackbar);
  };

  const dirData = {
    kind: props.entity.dir_kind,
    path: props.entity.path,
    name: props.entity.name,
  };

  let contextItems = [
    {
      label: "Copy path",
      fn: () => handleCopy(undefined, props.entity.path),
    },
    {
      label: "Copy URI",
      fn: () => handleCopy(undefined, props.entity.uri),
      divider: true,
    },
    {
      label: "Open in file explorer",
      fn: () => openExplorer(props.entity.path, enqueueSnackbar),
      divider: true,
    },
    {
      label: "Add to crate",
      fn: () => addToCrate([props.entity]),
      divider: true,
    },
  ];

  if (props.handleContextMenuSelection) {
    const fn = props.handleContextMenuSelection;
    const extraItems = [
      {
        label: "Rename",
        fn: () => fn("rename", dirData),
        disabled: props.entity.protected,
      },
      {
        label: "Delete",
        fn: () => fn("delete", dirData),
        disabled: props.entity.protected,
        divider: true,
      },
    ];
    contextItems.push(...extraItems);
  }

  const data = {
    kind: "component",
    entity: props.entity,
  };

  const handleAction = (action: IgniteAction) => {
    window.services.get_env("IGNITE_SESSION_ID").then((resp: any) => {
      clientRequest("run_action", {
        ...data,
        action: action.label,
        session_id: resp,
      });
    });
  };

  if (props.actions) {
    contextItems = contextItems.concat(
      Object.values(props.actions).map((action) => ({
        label: action.label,
        fn: () => handleAction(action),
      })),
    );
  }

  const getIconStyle = () => {
    const style = {} as React.CSSProperties;
    const extType = EXTENSIONTYPES.find((ext) => ext.extensions.includes(props.entity.ext));
    const iconName = extType?.name || "file.png";
    style.backgroundImage = `url(src/assets/components/${iconName})`;
    return style;
  };

  return (
    <div
      onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
      style={props.style}
    >
      <ContextMenu
        items={contextItems}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        title={props.entity.name}
        subtitle={props.entity.ext}
      />
      <div
        className={styles.compContainer}
        id={props.entity.filename}
        onClick={handleClick}
        style={containerStyle}
      >
        <div className={styles.compIcon} style={getIconStyle()} />
        <div className={styles.textContainer}>
          <Typography variant="subtitle1" className={styles.label}>
            {props.entity.filename}
          </Typography>
        </div>
        <div className={styles.spacer} />
        <IconButton onClick={(e) => handleCopy(e, props.entity.path)}>
          <CopyIcon style={{ fontSize: "20px" }} />
        </IconButton>
      </div>
    </div>
  );
};

export default Component;
