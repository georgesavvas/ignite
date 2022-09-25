import React, {useState} from "react";

import Link from "@mui/material/Link";
import {useSnackbar} from "notistack";

import {CopyToClipboard} from "../ContextActions";
import ContextMenu, {handleContextMenu} from "../../components/ContextMenu";
import openExplorer from "../../utils/openExplorer";


function ContextBarLink(props) {
  const {enqueueSnackbar} = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);
  const Icon = props.icon;

  const contextItems = [
    {
      "label": "Copy path",
      "fn": () =>  CopyToClipboard(props.path, enqueueSnackbar),
      "divider": true
    },
    {
      "label": "Open in file explorer",
      "fn": () => openExplorer(props.path, enqueueSnackbar)
    },
  ];

  const _handleContextMenu = e => {
    handleContextMenu(e, contextMenu, setContextMenu);
  };

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <Link underline="hover" style={{cursor: "pointer"}}
        onClick={e => {
          e.stopPropagation();
          props.setCurrentContext(props.path);
        }} onContextMenu={_handleContextMenu}
        sx={{ display: "flex", alignItems: "center" }}  color="inherit"
      >
        <Icon sx={{ mr: 0.5 }} fontSize="inherit" />
        {props.children}
      </Link>
    </>
  );
}

export default ContextBarLink;
