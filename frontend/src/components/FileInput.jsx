// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/* eslint-disable react/no-unknown-property */
import React, {useRef} from "react";

import IgnButton from "../components/IgnButton";
import TextField from "@mui/material/TextField";


export default function FileInput(props) {
  const hiddenFileInput = useRef(null);

  const {buttonStyle, ...other} = props;

  const handleChange = e => {
    if (!props.onChange) return;
    props.onChange(e.target.value);
  };

  const handleFileInput = e => {
    const paths = [...e.target.files].reduce((previous, current) => {
      return previous ? `${previous}\n${current.path}` : current.path;
    }, "");
    e.target.value = "";
    if (!props.onChange) return;
    if (!props.additive) {
      props.onChange(paths);
      return;
    }
    props.onChange(props.value ? `${props.value}\n${paths}` : paths);
  };

  const style = { 
    display: "flex",
    alignItems: !props.multiline ? "center" : "flex-start",
    gap: "5px",
    flexGrow: 10
  };

  return (
    <div style={{...style, ...props.style}}>
      <TextField
        {...other}
        value={props.value}
        onChange={handleChange}
        onBlur={handleChange}
      />
      <IgnButton
        variant="outlined"
        onClick={() => hiddenFileInput.current.click()}
        style={{height: 37.5, ...buttonStyle}}
      >
        ...
      </IgnButton>
      {props.children}
      <input
        ref={hiddenFileInput}
        type="file"
        // webkitdirectory={props.directory ? "true" : undefined}
        // directory={props.directory ? "true" : undefined}
        multiple={props.multiline}
        style={{display: "none"}}
        onChange={handleFileInput}
      />
    </div>
  );
}