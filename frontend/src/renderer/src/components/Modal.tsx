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

import ClearIcon from "@mui/icons-material/Clear";
import { Breakpoint, DialogProps } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent, { DialogContentProps } from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { ReactNode, useEffect } from "react";

import styles from "./Modal.module.css";

type ModalProps = React.PropsWithChildren<{
  title?: string;
  text?: string;
  open: boolean;
  dialogContentProps?: DialogContentProps;
  focusRef?: any;
  focusDelay?: number;
  fullHeight?: string;
  fullWidth?: boolean;
  onFormSubmit?: () => void;
  onClose: () => void;
  maxWidth: Breakpoint;
  buttons?: ReactNode[];
  style?: React.CSSProperties;
}>;

const Modal = ({ maxWidth = "xs", ...props }: ModalProps) => {
  useEffect(() => {
    if (!props.open || !props.focusRef) return;
    const timeout = setTimeout(() => {
      if (props.focusRef.current) props.focusRef.current.focus();
    }, props.focusDelay || 250);
    return () => {
      clearTimeout(timeout);
    };
  }, [props.open]);

  const dialogStyle = {
    "& .MuiDialog-container": {
      "& .MuiPaper-root": {
        backgroundColor: "rgb(20,20,20)",
        backgroundImage: "none",
        height: props.fullHeight ? "100%" : "none",
      },
    },
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (props.onFormSubmit) props.onFormSubmit();
  };

  const formWrapper = (children: ReactNode) => {
    if (props.onFormSubmit) return <form onSubmit={handleSubmit}>{children}</form>;
    else return children;
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose as DialogProps["onClose"]}
      fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
      maxWidth={maxWidth}
      sx={dialogStyle}
    >
      {formWrapper(
        <>
          <ClearIcon onClick={props.onClose} className={styles.closeButtonStyle} />
          {props.title ? (
            <DialogTitle style={{ padding: "10px 20px 0px 20px" }}>{props.title}</DialogTitle>
          ) : null}
          <DialogContent style={{ padding: "15px 20px" }} {...props.dialogContentProps}>
            {props.text ? <DialogContentText>{props.text}</DialogContentText> : null}
            {props.children}
          </DialogContent>
          {props.buttons ? <DialogActions>{props.buttons}</DialogActions> : null}
        </>
      )}
    </Dialog>
  );
};

export default Modal;
