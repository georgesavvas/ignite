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

import { Divider } from "@mui/material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { IgniteDirectory } from "@renderer/types/common";
import React, { useContext, useEffect, useState } from "react";

import Path from "../../components/Path";
import Tags from "../../components/Tags";
import URI from "../../components/URI";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import serverRequest from "../../services/serverRequest";
import Attributes from "./Attributes";

const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  padding: "5px",
} as React.CSSProperties;

const detailsStyle = {
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  marginBottom: "10px",
} as React.CSSProperties;

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
} as React.CSSProperties;

interface DirectoryDetailsProps {
  entity: IgniteDirectory;
}

const DirectoryDetails = (props: DirectoryDetailsProps) => {
  const [reprValue, setReprValue] = useState("");
  const [reptEdit, setReptEdit] = useState(false);
  const { refresh } = useContext(ContextContext) as ContextContextType;

  useEffect(() => {
    setReprValue("");
  }, [props.entity.path]);

  const handleReptChange = () => {
    if (props.entity.repr === null && !reprValue) {
      setReptEdit(false);
      return;
    }
    if (props.entity.repr === reprValue) {
      setReptEdit(false);
      return;
    }
    const data = {
      target: props.entity.path,
      repr: reprValue,
    };
    serverRequest("set_repr", data);
    setReprValue("");
    setReptEdit(false);
    refresh();
  };

  return (
    <div style={style}>
      <div style={detailsStyle}>
        <Typography variant="h5" style={{ marginBottom: "0px" }}>
          {props.entity.name}
        </Typography>
        <Divider sx={{ m: "5px" }} />
        <URI uri={props.entity.uri} />
        <Path path={props.entity.path} />
        <div style={rowStyle}>
          {reptEdit || !props.entity.repr ? (
            <TextField
              size="small"
              label="Get thumbnail from..."
              placeholder="Path or URI"
              fullWidth
              autoFocus={reptEdit && !!props.entity.repr && props.entity.repr !== null}
              value={reprValue}
              onChange={(e) => setReprValue(e.target.value)}
              onBlur={handleReptChange}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleReptChange();
              }}
            />
          ) : (
            <>
              <Typography style={{ minWidth: "110px" }}>Thumbnail from:</Typography>
              <URI uri={props.entity.repr} />
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setReprValue(props.entity.repr || "");
                  setReptEdit(true);
                }}
                color="ignite"
              >
                Edit
              </Button>
            </>
          )}
        </div>
        <Tags entityPath={props.entity.path} tags={props.entity.tags} onRefresh={refresh} />
      </div>
      <Attributes entityPath={props.entity.path} attributes={props.entity.attributes} />
    </div>
  );
};

export default DirectoryDetails;
