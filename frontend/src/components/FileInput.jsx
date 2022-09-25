/* eslint-disable react/no-unknown-property */
import React, {useRef} from "react";

import IgnButton from "../components/IgnButton";
import TextField from "@mui/material/TextField";


export default function FileInput(props) {
  const hiddenFileInput = useRef(null);

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
    gap: "5px"
  };

  return (
    <div style={{...style, ...props.style}}>
      <TextField
        {...props}
        value={props.value}
        onChange={handleChange}
        onBlur={handleChange}
      />
      <IgnButton
        variant="outlined"
        onClick={() => hiddenFileInput.current.click()}
        style={{height: 37.5, ...props.buttonStyle}}
      >
        ...
      </IgnButton>
      <input
        ref={hiddenFileInput}
        type="file"
        webkitdirectory={props.directory ? "true" : undefined}
        directory={props.directory ? "true" : undefined}
        multiple={props.multiline}
        style={{display: "none"}}
        onChange={handleFileInput}
      />
    </div>
  );
}
