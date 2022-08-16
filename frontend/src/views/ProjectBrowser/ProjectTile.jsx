import React, { useContext } from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";

function ProjectTile(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const hasThumbnail = props.entity.thumbnail && props.entity.thumbnail.filename;
  const thumbnailWidth = hasThumbnail ? "100%" : "50%";

  const dirData = {
    path: props.entity.path,
    kind: props.entity.dir_kind,
    name: props.entity.name
  }

  function getGenericContextItems(entity) {
    return [
      {
        label: "Copy path",
        fn: () =>  CopyToClipboard(entity.path, enqueueSnackbar)
      },
      {
        label: "Open in file explorer",
        fn: () => ShowInExplorer(entity.path, enqueueSnackbar),
        divider: true
      },
      {
        label: `Rename ${entity.dir_kind}`,
        fn: () => props.onContextMenu("rename", dirData)
      },
      {
        label: `Delete ${entity.dir_kind}`,
        fn: () => props.onContextMenu("delete", dirData),
        divider: true
      }
    ]
  }

  // function getSpecificContextItems(entity) {
  //   if (!DIRCONTEXTOPTIONS.hasOwnProperty(entity.dir_kind)) return [];
  //   return DIRCONTEXTOPTIONS[entity.dir_kind].map(contextOption => (
  //     {
  //       label: contextOption.label,
  //       value: contextOption.name,
  //       dir_path: entity.path,
  //       fn: () => props.onContextMenu(
  //         "create", {...entity, method: contextOption.name, kind: contextOption.dir_kind}
  //       )
  //     }
  //   ))
  // }

  const handleClick = (e) => {
    props.onSelected(props.project);
  }

  function thumbnailPath() {
    let path = "media/folder_icon.png";
    return path;
  }

  function details() {
    if (props.viewType === "grid") return(
      <>
        <Typography style={{position: "absolute", bottom: "5px", left: "10px"}}>
          {props.entity.name}
        </Typography>
      </>
    ); else return(
      <>
        <Typography align="left">{props.entity.name}</Typography>
      </>
    )
  }

  let contextItems = getGenericContextItems(props.entity);
  // contextItems = contextItems.concat(getSpecificContextItems(props.entity));

  return (
    <>
      <Tile
        {...props}
        thumbnail={hasThumbnail ? undefined : thumbnailPath()}
        thumbnailWidth={thumbnailWidth}
        onClick={handleClick}
        contextItems={contextItems}
      >
        {details()}
      </Tile>
    </>
  );
}

export default ProjectTile;