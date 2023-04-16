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

import {
  DOMElement,
  ReactComponentElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ReflexContainer, ReflexElement, ReflexElementProps, ReflexSplitter } from "react-reflex";

import { ConfigContext } from "../contexts/ConfigContext";
import Details from "./DetailsView/Details";
import Divider from "@mui/material/Divider";
import Explorer from "./Explorer/Explorer";
import LostConnectionOverlay from "./LostConnectionOverlay";
import ProcessManager from "./ProcessManager/ProcessManager";
import ProjectTree from "./TreeView/ProjectTree";
import TopBar from "./TopBar/TopBar";
import WaitingForBackendOverlay from "./WaitingForBackendOverlay";
import Welcome from "./Welcome";
import loadReflexLayout from "../utils/loadReflexLayout";
import saveReflexLayout from "../utils/saveReflexLayout";
import serverRequest from "../services/serverRequest";
import styles from "./Home.module.css";

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)",
};

const defaultFlexRations = {
  "home.tree": 0.2,
  "home.explorer": 0.5,
  "home.details": 0.3,
};

export const Home = () => {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [waitBackendOpen, setWaitBackendOpen] = useState(true);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
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
      "home.details": details[0] / fullWidth,
    };
    setFlexRatios(ratios);
  }, []);

  useEffect(() => {
    if (!config.ready) return;
    setWaitBackendOpen(false);
    openWelcomeDialogueIfNeeded();
  }, [config.ready]);

  const openWelcomeDialogueIfNeeded = () => {
    const noWelcome = localStorage.getItem("disable_welcome");
    if (noWelcome === "true") return;
    serverRequest("get_projects").then((resp) => {
      if (resp && resp.data.length) {
        localStorage.setItem("disable_welcome", "true");
        return;
      } else {
        console.log("No projects found, displaying welcome dialogue!", resp);
      }
      setWelcomeOpen(true);
    });
  };

  const handleResized = useCallback((data) => {
    saveReflexLayout(data);
  }, []);

  return (
    <div className={styles.container}>
      {waitBackendOpen ? <WaitingForBackendOverlay /> : null}
      {config.lostConnection ? <LostConnectionOverlay /> : null}
      <Welcome open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
      <div className={styles.topBar}>
        <TopBar />
        <Divider />
      </div>
      <div className={styles.contents}>
        <ReflexContainer orientation="vertical">
          <ReflexElement
            flex={flexRatios["home.tree"]}
            name="home.tree"
            onStopResize={handleResized}
          >
            <ReflexContainer>
              <ReflexElement flex={0.75}>
                <ProjectTree />
              </ReflexElement>
              <ReflexSplitter style={splitterStyle} />
              <ReflexElement flex={0.25}>
                <ProcessManager />
              </ReflexElement>
            </ReflexContainer>
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement
            flex={flexRatios["home.explorer"]}
            name="home.explorer"
            onStopResize={handleResized}
          >
            <Explorer />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement
            flex={flexRatios["home.details"]}
            name="home.details"
            onStopResize={handleResized}
          >
            <Details />
          </ReflexElement>
        </ReflexContainer>
      </div>
    </div>
  );
};

export default Home;
