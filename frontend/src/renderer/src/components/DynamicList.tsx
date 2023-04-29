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

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Typography } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import React from "react";

import styles from "./DynamicList.module.css";

const createListItem = (child: React.ReactNode, index: number, dense?: boolean) => {
  return (
    <ListItem key={index} dense={dense}>
      {child}
    </ListItem>
  );
};

interface ButtonProps {
  title?: string;
  onAdd?: Function;
  onRemove?: Function;
}

const buttons = (props: ButtonProps) => {
  return (
    <div className={styles.buttonContainer}>
      {props.title ? (
        <Typography variant="h5" className={styles.title}>
          {props.title}
        </Typography>
      ) : null}
      <AddIcon component="div" className={styles.button} onClick={props.onAdd} />
      <RemoveIcon component="div" className={styles.button} onClick={props.onRemove} />
    </div>
  );
};

interface DynamicListProps {
  noButtons?: boolean;
  onScroll?: React.UIEventHandler<HTMLUListElement>;
  style?: React.CSSProperties;
  title?: string;
  onAdd?: Function;
  onRemove?: Function;
  dense?: boolean;
  innerRef?: any;
  children: React.ReactNode | React.ReactNode[];
}

const DynamicList = (props: DynamicListProps) => {
  return (
    <>
      {props.noButtons ? null : buttons(props)}
      <List
        className={styles.container}
        onScroll={props.onScroll}
        style={props.style}
        ref={props.innerRef}
      >
        {props.children
          ? props.children.map((child: React.ReactNode, index: number) =>
              createListItem(child, index, props.dense)
            )
          : null}
      </List>
    </>
  );
};

export default DynamicList;
