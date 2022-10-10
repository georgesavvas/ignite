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


import React, {useEffect, useState, useContext} from "react";

import Divider from "@mui/material/Divider";
import {ReflexContainer, ReflexSplitter, ReflexElement} from "react-reflex";

import Details from "../views/DetailsView/Details";
import TaskManager from "../views/TaskManager/TaskManager";
import saveReflexLayout from "../utils/saveReflexLayout";
import loadReflexLayout from "../utils/loadReflexLayout";
import ProjectTree from "../views/TreeView/ProjectTree";
import TopBar from "../views/TopBar/TopBar";
import styles from "./Home.module.css";
import Explorer from "../views/Explorer/Explorer";
import LostConnectionOverlay from "./LostConnectionOverlay";
import {ConfigContext} from "../contexts/ConfigContext";


const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
};

const defaultFlexRations = {
  "home.tree": 0.2,
  "home.explorer": 0.5,
  "home.details": 0.3
};

export default function Home() {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [config] = useContext(ConfigContext);

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const tree = data["home.tree"];
    const explorer = data["home.explorer"];
    const details = data["home.details"];
    if (!tree || !explorer || !details) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const fullWidth = tree[0] + explorer[0] + details[0];
    const ratios = {
      "home.tree": tree[0] / fullWidth,
      "home.explorer": explorer[0] / fullWidth,
      "home.details": details[0] / fullWidth
    };
    setFlexRatios(ratios);
  }, []);

  const handleResized = data => {
    saveReflexLayout(data);
  };

  return (
    <div className={styles.container}>
      {config.lostConnection ? <LostConnectionOverlay /> : null}
      <div className={styles.topBar}>
        <TopBar />
        <Divider />
      </div>
      <div className={styles.contents}>
        <ReflexContainer orientation="vertical">
          <ReflexElement flex={flexRatios["home.tree"]} name="home.tree"
            onStopResize={handleResized}
          >
            <ReflexContainer>
              <ReflexElement flex={0.75}>
                <ProjectTree />
              </ReflexElement>
              <ReflexSplitter style={splitterStyle} />
              <ReflexElement flex={0.25}>
                <TaskManager />
              </ReflexElement>
            </ReflexContainer>
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={flexRatios["home.explorer"]} name="home.explorer"
            onStopResize={handleResized}
          >
            <Explorer />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={flexRatios["home.details"]} name="home.details"
            onStopResize={handleResized}
          >
            <Details />
          </ReflexElement>
        </ReflexContainer>
      </div>
    </div>
  );
}
