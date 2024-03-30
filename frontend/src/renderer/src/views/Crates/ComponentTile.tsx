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

import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import { setReprForParent, setReprForProject } from "../ContextActions";

import { IgniteComponent } from "@renderer/types/common";
import Tile from "../../components/Tile";
import Typography from "@mui/material/Typography";
import { useContext } from "react";
import { useSnackbar } from "notistack";

interface ComponentTileProps {
  entity: IgniteComponent;
  onContextMenu: (action: string, data: any) => void;
}

const ComponentTile = (props: ComponentTileProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentContext } = useContext(ContextContext) as ContextContextType;

  const thumbnailWidth = "100%";
  let currentPath = "";
  if (currentContext.path_nr)
    currentPath = currentContext.path_nr.replace(currentContext.project + "/", "");
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
    // {
    //   label: "Go to task",
    //   fn: () => setCurrentContext(props.entity.task),
    //   divider: true,
    // },
    {
      label: "Add to Vault",
      fn: () => props.onContextMenu("vaultImport", dirData),
    },
    // {
    //   label: "Import new version from Vault",
    //   fn: () =>  props.onContextMenu("vaultExport", dirData),
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
    // {
    //   label: "Rename asset",
    //   fn: () =>
    //     props.onContextMenu("rename", {
    //       name: props.entity.name,
    //       kind: "asset",
    //       path: props.entity.asset,
    //     }),
    // },
    {
      label: "Delete asset version",
      fn: () => props.onContextMenu("delete", dirData),
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
      </>
    );
  };

  return (
    <>
      <Tile {...props} contextItems={contextItems} thumbnailWidth={thumbnailWidth}>
        {details()}
      </Tile>
    </>
  );
};

export default ComponentTile;
