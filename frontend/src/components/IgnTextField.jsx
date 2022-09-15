import { TextField } from "@mui/material";
import React from "react";

export default function IgnTextField(props) {
  return (
    <TextField size="small" {...props} InputProps={{style: {height: "30px", padding: "0px"}}} />
  )
}
