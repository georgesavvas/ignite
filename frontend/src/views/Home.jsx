import ProjectTree from '../views/TreeView/ProjectTree';
import TopBar from "../views/TopBar";
import styles from "./Home.module.css";
import Explorer from "../views/Explorer/Explorer";
import Divider from '@mui/material/Divider';
import Details from '../views/DetailsView/Details';
import saveReflexLayout from "../utils/saveReflexLayout";
import loadReflexLayout from "../utils/loadReflexLayout";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import { useEffect, useState } from 'react';

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
}

const defaultFlexRations = {
  "home.tree": 0.2,
  "home.explorer": 0.5,
  "home.details": 0.3
}

export default function Home() {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const tree = data["home.tree"];
    const explorer = data["home.explorer"];
    const details = data["home.details"];
    if (!tree || !explorer || !details) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const fullWidth = tree[0] + explorer[0] + details[0];
    const ratios = {
      "home.tree": tree[0] / fullWidth,
      "home.explorer": explorer[0] / fullWidth,
      "home.details": details[0] / fullWidth
    };
    setFlexRatios(ratios);
  }, [])

  const handleResized = data => {
    saveReflexLayout(data)
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <TopBar />
        <Divider />
      </div>
      <div className={styles.contents}>
        <ReflexContainer orientation="vertical">
          <ReflexElement flex={flexRatios["home.tree"]} name="home.tree" onStopResize={handleResized}>
            <ProjectTree />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={flexRatios["home.explorer"]} name="home.explorer" onStopResize={handleResized}>
            <Explorer />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={flexRatios["home.details"]} name="home.details" onStopResize={handleResized}>
            <Details />
          </ReflexElement>
        </ReflexContainer>
      </div>
    </div>
  );
}
