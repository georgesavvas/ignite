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


import React from "react";

import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

import styles from "./WaitingForBackendOverlay.module.css";


const WaitingForBackendOverlay = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Typography variant="h4">
          Waiting for Ignite server...
        </Typography>
        <LinearProgress style={{width: "400px"}} color="ignite" />
      </div>
    </div>
  );
};

export default WaitingForBackendOverlay;
