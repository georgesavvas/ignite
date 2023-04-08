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


import React, {useState} from "react";

import Typography from "@mui/material/Typography";

import styles from "./SystemResources.module.css";


const ResourceBox = props => {
  const style = {
    right: `${100 - props.value}%`
  };
  return (
    <div className={styles.resourceBoxContainer}>
      <Typography variant="caption" className={styles.type}>{props.label}:</Typography>
      <Typography variant="caption" className={styles.type}>{Math.round(props.value)}%</Typography>
      <div className={styles.resourceBoxBackground} style={style} />
      <div className={styles.resourceBoxBackgroundFilled} />
    </div>
  );
};

export default function SystemResources() {
  const [usageData, setUsageData] = useState({});

  window.services.onResourceUsage((_event, data) => {
    setUsageData(data);
  });

  return (
    <div className={styles.container}>
      <ResourceBox label="CPU" value={usageData.cpu} />
      {/* <Divider orientation="vertical" /> */}
      <ResourceBox label="RAM" value={usageData.mem} />
    </div>
  );
}
