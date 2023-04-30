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

import Typography from "@mui/material/Typography";
import { AssetVersion } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import { useContext } from "react";

import Tile, { TileProps } from "../../components/Tile";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import { CrateContext, CrateContextType } from "../../contexts/CrateContext";
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import { setReprForParent, setReprForProject } from "../ContextActions";

interface AssetTileProps extends TileProps {
  entity: IgniteAssetVersion;
  onSelected?: (entity: IgniteAssetVersion) => void;
  viewType?: "dynamic" | "tasks" | "assets" | "scenes";
  refreshContext?: () => void;
  onContextMenu: () => void;
  handleContextMenuSelection: (action: string, data: any) => void;
}

const AssetTile = (props: IgniteAssetTileProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { addToCrate } = useContext(CrateContext) as CrateContextType;
  const { currentContext, setCurrentContext } = useContext(ContextContext) as ContextContextType;

  const hasThumbnail = props.entity.thumbnail && props.entity.thumbnail.filename;
  const thumbnailWidth = hasThumbnail ? "100%" : "50%";
  const currentPath = currentContext.path_nr?.replace(currentContext.project + "/", "");
  let contextPath = props.entity.context.replace(currentPath, "");
  if (contextPath.startsWith("/")) contextPath = contextPath.slice(1);

  const dirData = {
    kind: props.entity.dir_kind,
    path: props.entity.path,
    name: props.entity.name,
  };

  const contextItems = [
    {
      label: "Copy URI",
      fn: () => CopyToClipboard(props.entity.uri, enqueueSnackbar),
    },
    {
      label: "Copy path",
      fn: () => CopyToClipboard(props.entity.path, enqueueSnackbar),
      divider: true,
    },
    {
      label: "Go to task",
      fn: () => setCurrentContext(props.entity.task),
      divider: true,
    },
    {
      label: "Add to Vault",
      fn: () => props.handleContextMenuSelection("vaultImport", dirData),
    },
    // {
    //   label: "Import new version from Vault",
    //   fn: () =>  props.handleContextMenuSelection("vaultExport", dirData),
    //   divider: true
    // },
    {
      label: "Use thumbnail for project",
      fn: () => setReprForProject(props.entity.path, enqueueSnackbar),
    },
    {
      label: "Use thumbnail for parent",
      fn: () => setReprForParent(props.entity.path, enqueueSnackbar),
      divider: true,
    },
    {
      label: "Open in file explorer",
      fn: () => ShowInExplorer(props.entity.path, enqueueSnackbar),
      divider: true,
    },
    {
      label: "Add to crate",
      fn: () => addToCrate([props.entity]),
      divider: true,
    },
    {
      label: "Rename asset",
      disabled: props.entity.protected,
      fn: () =>
        props.handleContextMenuSelection("rename", {
          name: props.entity.name,
          kind: "asset",
          path: props.entity.asset,
        }),
    },
    {
      label: "Delete asset (all versions)",
      disabled: props.entity.protected,
      fn: () =>
        props.handleContextMenuSelection("delete", {
          name: props.entity.name,
          kind: "asset",
          path: props.entity.asset,
        }),
    },
    {
      label: "Delete asset version",
      disabled: props.entity.protected,
      fn: () => props.handleContextMenuSelection("delete", dirData),
    },
  ];

  const details = () => {
    return (
      <>
        <Typography style={{ position: "absolute", top: "5px", left: "10px" }}>
          {contextPath || "asset"}
        </Typography>
        <Typography style={{ position: "absolute", bottom: "5px", left: "10px" }}>
          {props.entity.name}
        </Typography>
        <Typography style={{ position: "absolute", bottom: "5px", right: "10px" }}>
          {props.entity.version}
        </Typography>
        {props.entity.protected ? (
          <img
            alt="protected"
            src="src/assets/shield.png"
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              height: "20px",
              width: "20px",
            }}
          />
        ) : (
          <img
            alt="unprotected"
            src="src/assets/shield_broken.png"
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              height: "20px",
              width: "20px",
            }}
          />
        )}
      </>
    );
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", props.entity.uri);
    e.dataTransfer.setData("ignite/kind", props.entity.dir_kind);
    e.dataTransfer.setData("ignite/path", props.entity.path);
    e.dataTransfer.setData("ignite/uri", props.entity.uri);
  };

  return (
    <>
      <Tile
        {...props}
        contextItems={contextItems}
        thumbnail={hasThumbnail ? undefined : "src/assets/no_icon_grey.png"}
        thumbnailWidth={thumbnailWidth}
        draggable={true}
        onDragStart={handleDragStart}
      >
        {details()}
      </Tile>
    </>
  );
};

export default AssetTile;
