import React, {useContext} from "react";

import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";

import {CopyToClipboard, ShowInExplorer} from "../ContextActions";
import { ContextContext } from "../../contexts/ContextContext";
import {ConfigContext} from "../../contexts/ConfigContext";
import Tile from "../../components/Tile";
import BuildFileURL from "../../services/BuildFileURL";


function AssetTile(props) {
  const [currentContext] = useContext(ContextContext);
  const [config] = useContext(ConfigContext);
  const {enqueueSnackbar} = useSnackbar();

  const hasThumbnail = props.entity.thumbnail && props.entity.thumbnail.filename;
  const thumbnailWidth = hasThumbnail ? "100%" : "50%";

  const dirData = {
    kind: props.entity.dir_kind,
    path: props.entity.path,
    name: props.entity.name
  };

  const contextItems = [
    {
      label: "Copy URI",
      fn: () =>  CopyToClipboard(props.entity.uri, enqueueSnackbar)
    },
    {
      label: "Copy path",
      fn: () =>  CopyToClipboard(props.entity.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Open in file explorer",
      fn: () => ShowInExplorer(props.entity.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Delete asset version",
      fn: () => props.onContextMenu("delete", dirData)
    }
  ];

  const vaultExportItem = {
    label: "Import to current task",
    fn: () =>  props.onContextMenu("vaultExport", {
      ...dirData,
      task: BuildFileURL(currentContext.path, config, {pathOnly: true})
    }),
    divider: true
  };

  if (currentContext.dir_kind === "task") {
    contextItems.splice(2, 0, vaultExportItem);
  }

  function details() {
    return (
      <>
        <Typography style={{position: "absolute", bottom: "5px", left: "10px"}}>
          {props.entity.name}
        </Typography>
      </>
    );
  }

  return (
    <>
      <Tile {...props} contextItems={contextItems} thumbnailWidth={thumbnailWidth}
        thumbnail={hasThumbnail ? undefined : "media/no_icon_grey.png"} noTopGradient
      >
        {details()}
      </Tile>
    </>
  );
}

export default AssetTile;
