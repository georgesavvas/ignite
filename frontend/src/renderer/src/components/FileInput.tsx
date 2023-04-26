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

/* eslint-disable react/no-unknown-property */

import TextField, { TextFieldProps } from "@mui/material/TextField";
import { ClickEvent, InputChangeEvent } from "@renderer/types/common";

import styles from "./FileInput.module.css";
import IgnButton from "./IgnButton";

type FileInputProps = React.PropsWithChildren<{
  label: string;
  size: string;
  fullWidth?: boolean;
  disabled?: boolean;
  onChange?: Function;
  multiline?: boolean;
  style?: React.CSSProperties;
  value?: any;
  buttonStyle?: React.CSSProperties;
  multi?: boolean;
  buttonLabel?: string;
  directory?: boolean;
}>;

export const FileInput = (props: FileInputProps) => {
  const { buttonStyle, directory, multi, buttonLabel, ...other } = props;

  const handleChange = (e: InputChangeEvent) => {
    if (!props.onChange) return;
    props.onChange(e, e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleChange(e);
  };

  const handleFileInput = async (e: ClickEvent) => {
    const properties = multi ? ["multiSelections"] : [];
    const resp = directory
      ? await window.api.dirInput(properties)
      : await window.api.fileInput(properties);
    if (resp.cancelled) return;
    const filePaths = resp.filePaths;
    if (!props.onChange || !filePaths?.length) return;
    props.onChange(e, filePaths.join("\n"));
  };

  const style = {
    alignItems: !props.multiline ? "center" : "flex-start",
  };

  return (
    <div className={styles.container} style={{ ...style, ...props.style }}>
      <TextField
        {...(other as TextFieldProps)}
        value={props.value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <IgnButton
        variant="outlined"
        onClick={handleFileInput}
        style={{ height: 37.5, ...buttonStyle }}
      >
        {buttonLabel || "..."}
      </IgnButton>
      {props.children}
    </div>
  );
};

export default FileInput;
