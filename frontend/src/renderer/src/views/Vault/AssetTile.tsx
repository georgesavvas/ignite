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
import { IgniteAssetVersion } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import React, { useContext } from "react";

import Tile, { TileProps } from "../../components/Tile";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import BuildFileURL from "../../services/BuildFileURL";
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";

interface AssetTileProps extends TileProps {
  entity: IgniteAssetVersion;
  refreshContext?: () => void;
  onContextMenu?: () => void;
  handleContextMenuSelection: (action: string, data: any) => void;
}

const AssetTile = (props: AssetTileProps) => {
  const { currentContext } = useContext(ContextContext) as ContextContextType;
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const { enqueueSnackbar } = useSnackbar();

  const hasThumbnail = props.entity.thumbnail && props.entity.thumbnail.filename;
  const thumbnailWidth = hasThumbnail ? "100%" : "50%";

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
      label: "Open in file explorer",
      fn: () => ShowInExplorer(props.entity.path, enqueueSnackbar),
      divider: true,
    },
    {
      label: "Delete asset version",
      fn: () => props.handleContextMenuSelection("delete", dirData),
    },
  ];

  const vaultExportItem = {
    label: "Import to current task",
    fn: () =>
      props.handleContextMenuSelection("vaultExport", {
        ...dirData,
        task: BuildFileURL(currentContext.path, config, { pathOnly: true }),
      }),
    divider: true,
  };

  if (currentContext.dir_kind === "task") {
    contextItems.splice(2, 0, vaultExportItem);
  }

  const details = () => {
    return (
      <>
        <Typography style={{ position: "absolute", bottom: "5px", left: "10px" }}>
          {props.entity.name}
        </Typography>
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
        thumbnailWidth={thumbnailWidth}
        noTopGradient
        thumbnail={hasThumbnail ? undefined : "src/assets/no_icon_grey.png"}
        draggable={true}
        onDragStart={handleDragStart}
      >
        {details()}
      </Tile>
    </>
  );
};

export default AssetTile;
