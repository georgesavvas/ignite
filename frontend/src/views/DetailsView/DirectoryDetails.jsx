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


import React, {useState, useContext, useEffect} from "react";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TagContainer from "./TagContainer";
import TextField from "@mui/material/TextField";

import serverRequest from "../../services/serverRequest";
import Attributes from "./Attributes";
import URI from "../../components/URI";
import Path from "../../components/Path";
import {ContextContext} from "../../contexts/ContextContext";

const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column"
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "10px"
};

function DirectoryDetails(props) {
  const [reprValue, setReprValue] = useState("");
  const [reptEdit, setReptEdit] = useState(false);
  const [,, refreshContext] = useContext(ContextContext);

  useEffect(() => {
    setReprValue("");
  }, [props.entity.path]);

  const handleReptChange = () => {
    if (props.entity.repr === null && !reprValue) {setReptEdit(false); return;}
    if (props.entity.repr === reprValue) {setReptEdit(false); return;}
    const data = {
      target: props.entity.path,
      repr: reprValue
    };
    serverRequest("set_repr", data);
    setReprValue("");
    setReptEdit(false);
    refreshContext();
  };

  return (
    <div style={style}>
      <div style={{margin: "10px", overflow: "hidden"}}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>
          {props.entity.name}
        </Typography>
        <URI uri={props.entity.uri} />
        <Path path={props.entity.path} />
        <div style={rowStyle}>
          {reptEdit || !props.entity.repr ?
            <TextField
              size="small"
              label="Get thumbnail from..."
              placeholder="Path or URI"
              fullWidth
              autoFocus={reptEdit && props.entity.repr && props.entity.repr !== null}
              value={reprValue}
              onChange={e => setReprValue(e.target.value)}
              onBlur={handleReptChange}
              onKeyPress={e => {if (e.key === "Enter") handleReptChange();}}
            /> :
            <>
              <Typography style={{minWidth: "110px"}}>Thumbnail from:</Typography>
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
          }
        </div>
      </div>
      <TagContainer entityPath={props.entity.path} tags={props.entity.tags} />
      <Attributes entityPath={props.entity.path} attributes={props.entity.attributes} />
    </div>
  );
}

export default DirectoryDetails;
