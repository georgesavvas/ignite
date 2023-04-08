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


import React, {useState, useContext} from "react";

import Typography from "@mui/material/Typography";
import {useSnackbar} from "notistack";

import styles from "./URI.module.css";
import ContextMenu, { handleContextMenu } from "./ContextMenu";
import {CopyToClipboard} from "../views/ContextActions";
import {ContextContext} from "../contexts/ContextContext";


function URI(props) {
  const [, setCurrentContext] = useContext(ContextContext);
  const [contextMenu, setContextMenu] = useState(null);
  const {enqueueSnackbar} = useSnackbar();

  const contextItems = [
    {
      "label": "Copy",
      "fn": () => CopyToClipboard(props.uri, enqueueSnackbar)
    },
    {
      "label": "Go to asset",
      "fn": () => setCurrentContext(props.uri)
    }
  ];

  if (!props.uri) return null;

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <div
        className={styles.container}
        onClick={e => handleContextMenu(e, contextMenu, setContextMenu)}
        style={props.style}
      >
        <Typography
          noWrap
          style={{
            color: "rgb(252, 140, 3)",
            direction: "rtl",
            textAlign: "left"
          }}
        >
          {props.uri}
        </Typography>
      </div>
    </>
  );
}

export default URI;
