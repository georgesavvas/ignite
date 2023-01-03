// Copyright 2022 Georgios Savvas

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
      "fn": () =>  CopyToClipboard(`${props.root}/${props.path}`, enqueueSnackbar),
      "divider": true
    },
    {
      "label": "Open in file explorer",
      "fn": () => openExplorer(`${props.root}/${props.path}`, enqueueSnackbar)
    },
  ];

  const _handleContextMenu = e => {
    handleContextMenu(e, contextMenu, setContextMenu);
  };

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
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
