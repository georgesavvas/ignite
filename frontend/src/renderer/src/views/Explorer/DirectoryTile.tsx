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

import { Box, SvgIcon } from "@mui/material";
import { ClickEvent, IgniteDirectory, IgniteScene } from "@renderer/types/common";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import { CopyToClipboard, ShowInExplorer, clearRepr } from "../ContextActions";
import { CrateContext, CrateContextType } from "../../contexts/CrateContext";
import React, { useContext } from "react";
import Tile, { TileProps } from "../../components/Tile";
import { setReprForParent, setReprForProject } from "../ContextActions";

import { DCCINFO } from "@renderer/constants/dccInfo";
import { DIRCONTEXTOPTIONS } from "@renderer/constants/directoryContextOptions";
import { DIRECTORYICONS } from "@renderer/constants/directoryIcons";
import Typography from "@mui/material/Typography";
import { ViewType } from "./Explorer";
import { useSnackbar } from "notistack";

const folderIcon = new URL("@assets/folder_icon.png", import.meta.url).href;
const dccUnknownIcon = new URL("@assets/dcc/unknown.png", import.meta.url).href;

const getDccIcon = (name: string) => {
  if (!name) return "";
  const dcc = DCCINFO.find((dcc) =>
    dcc.keywords.some((keyword: string) => name.toLowerCase().replaceAll(" ", "").includes(keyword))
  );
  return `src/assets/${dcc?.icon}`;
};

const isDirectoryScene = (entity: IgniteDirectory | IgniteScene): entity is IgniteScene => {
  return entity.dir_kind === "scene";
};

interface DirectoryTileProps extends TileProps {
  entity: IgniteDirectory | IgniteScene;
  viewType?: ViewType;
  refreshContext?: () => void;
  handleContextMenuSelection?: (action: string, data: any) => void;
}

const DirectoryTile = (props: DirectoryTileProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { addToCrate } = useContext(CrateContext) as CrateContextType;
  const { currentContext, setCurrentContext } = useContext(ContextContext) as ContextContextType;
  const hasThumbnail = props.entity.thumbnail?.filename !== undefined;
  const isScene = isDirectoryScene(props.entity);
  let sceneIcon = isDirectoryScene(props.entity) ? getDccIcon(props.entity.dcc) : undefined;
  const thumbnailWidth = sceneIcon || hasThumbnail ? "100%" : "30%";
  const currentPath = currentContext.path_nr?.replace(currentContext.project + "/", "");
  let contextPath = props.entity.context.replace(currentPath, "");
  if (contextPath.startsWith("/")) contextPath = contextPath.slice(1);

  const dirData = {
    path: props.entity.path,
    kind: props.entity.dir_kind,
    name: props.entity.name,
  };

  const getGenericContextItems = (entity: IgniteDirectory | IgniteScene) => {
    const contextItems = [
      {
        label: "Copy path",
        fn: () => CopyToClipboard(entity.path, enqueueSnackbar),
      },
      {
        label: "Open in file explorer",
        fn: () => ShowInExplorer(entity.path, enqueueSnackbar),
        divider: true,
      },
      {
        label: "Add to crate",
        fn: () => addToCrate([entity]),
        divider: true,
      },
      // {
      //   label: "Import asset from Vault",
      //   fn: () =>  props.handleContextMenuSelection("vaultExport", dirData),
      //   divider: true
      // },
      {
        label: "Clear thumbnail asset",
        fn: () => clearRepr(entity.path, enqueueSnackbar, props.refreshContext),
      },
      {
        label: "Use thumbnail for project",
        fn: () => setReprForProject(entity.path, enqueueSnackbar),
      },
      {
        label: "Use representative for parent",
        fn: () => setReprForParent(entity.path, enqueueSnackbar),
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
    return contextItems;
  };

  const getSpecificContextItems = (entity: IgniteDirectory | IgniteScene) => {
    if (!props.handleContextMenuSelection) return [];
    if (!DIRCONTEXTOPTIONS[entity.dir_kind as keyof typeof DIRCONTEXTOPTIONS]) return [];
    const fn = props.handleContextMenuSelection;
    const kindOptions = DIRCONTEXTOPTIONS[entity.dir_kind as keyof typeof DIRCONTEXTOPTIONS];
    const namedOptions =
      kindOptions[entity.name as keyof typeof kindOptions] || kindOptions.default;
    return namedOptions.map((contextOption) => ({
      label: contextOption.label,
      value: contextOption.name,
      dir_path: entity.path,
      fn: () =>
        fn("create", {
          ...entity,
          method: contextOption.name,
          kind: contextOption.dir_kind,
        }),
    }));
  };

  const handleClick = (e: ClickEvent) => {
    if (e.detail === 2) {
      var path = props.entity.path;
      if (props.entity.task) {
        path = props.entity.task;
      }
      setCurrentContext(path);
    }
  };

  const name = isDirectoryScene(props.entity) ? props.entity.dcc : props.entity.name;

  let Icon =
    props.entity.icon && props.entity.icon in DIRECTORYICONS
      ? DIRECTORYICONS[props.entity.icon as keyof typeof DIRECTORYICONS]
      : undefined;

  const getBadge = () => {
    if (!hasThumbnail) return null;
    const style = {
      position: "absolute",
      top: "10px",
      right: "10px",
      height: "25px",
      width: "25px",
      borderRadius: "2px",
      color: "rgb(150, 150, 150)",
    } as React.CSSProperties;
    if (isScene && sceneIcon) return <img src={sceneIcon} style={style} />;
    return <Box component={Icon as typeof SvgIcon} style={style} />;
  };

  let version = "";
  if ("version" in props.entity) version = props.entity.version as string;

  const details = () => {
    return (
      <>
        <Typography style={{ position: "absolute", top: "5px", left: "10px" }}>
          {contextPath || props.entity.dir_kind}
        </Typography>
        <Typography style={{ position: "absolute", bottom: "5px", left: "10px" }}>
          {name}
        </Typography>
        <Typography style={{ position: "absolute", bottom: "5px", right: "10px" }}>
          {version}
        </Typography>
        {getBadge()}
      </>
    );
  };

  let contextItems = getGenericContextItems(props.entity);
  contextItems = contextItems.concat(getSpecificContextItems(props.entity));
  if (isScene) {
    const goToTaskItem = {
      label: "Go to task",
      fn: () => setCurrentContext(props.entity.task || ""),
      divider: true,
    };
    contextItems.splice(2, 0, goToTaskItem);
  } else if (props.entity.dir_kind === "task") {
    const goToTaskItem = {
      label: "Go to task",
      fn: () => setCurrentContext(props.entity.path),
      divider: true,
    };
    contextItems.splice(2, 0, goToTaskItem);
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", props.entity.uri);
    e.dataTransfer.setData("ignite/kind", props.entity.dir_kind);
    e.dataTransfer.setData("ignite/path", props.entity.path);
    e.dataTransfer.setData("ignite/uri", props.entity.uri);
  };

  const getThumbnailUrl = () => {
    if (isScene) return sceneIcon || dccUnknownIcon;
    return folderIcon;
  };

  return (
    <>
      <Tile
        {...props}
        thumbnail={hasThumbnail ? undefined : getThumbnailUrl()}
        thumbnailComp={hasThumbnail ? undefined : (Icon as React.ComponentType)}
        thumbnailWidth={thumbnailWidth}
        onClick={handleClick}
        contextItems={contextItems}
        columnWidths={
          isScene ? ["100px", "100px", "100px", "200px"] : ["100px", "100px", "100px", "200px"]
        }
        draggable={true}
        onDragStart={handleDragStart}
      >
        {details()}
      </Tile>
    </>
  );
};

export default DirectoryTile;
