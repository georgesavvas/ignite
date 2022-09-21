/* eslint-disable react/no-unknown-property */
import React, { useRef } from "react"
import Button from "@mui/material/Button"
import { TextField } from "@mui/material"

export default function FileInput(props) {
  const hiddenFileInput = useRef(null)

  const handleChange = e => {
    if (!props.onChange) return
    props.onChange(e.target.value)
  }

  const handleFileInput = e => {
    const paths = [...e.target.files].reduce((previous, current) => {
      return previous ? `${previous}\n${current.path}` : current.path
    }, "")
    e.target.value = ""
    if (!props.onChange) return
    if (!props.additive) {
      props.onChange(paths)
      return
    }
    props.onChange(props.value ? `${props.value}\n${paths}` : paths)
  }

  return (
    <div style={{display: "flex", gap: "10px", width: "100%"}}>
      <TextField
        {...props}
        value={props.value}
        onChange={handleChange}
        onBlur={handleChange}
      />
      <Button
        variant="outlined"
        // sx={{maxHeight: "40px"}}
        onClick={() => hiddenFileInput.current.click()}
      >
        ...
      </Button>
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
  )
}
