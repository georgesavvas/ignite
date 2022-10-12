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


import React from "react";

import { Typography } from "@mui/material";

import IgnButton from "../components/IgnButton";
import Modal from "../components/Modal";
import styles from "./Welcome.module.css";
import IgnTextField from "../components/IgnTextField";


const Welcome = props => {
  return (
    <Modal open={props.open} maxWidth="sm">
      <div className={styles.container}>
        <Typography variant="h4">Welcome to Ignite!</Typography>
        <div className={styles.section}>
          <Typography></Typography>
        </div>
        <div className={styles.row}>
          <IgnTextField label="Project Name" fullWidth />
          <IgnButton color="ignite" style={{minWidth: "250px"}}>Create your first project</IgnButton>
        </div>
      </div>
    </Modal>
  );
};

export default Welcome;
