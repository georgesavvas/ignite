import ReactSplit, { SplitDirection } from '@devbookhq/splitter'
import ProjectTree from '../components/ProjectTree';
import TopBar from "../components/TopBar";
import styles from "./Home.module.css";
import Explorer from "../components/Explorer";
import Divider from '@mui/material/Divider';
import Details from '../components/Details';
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'

export default function Home() {
  const splitterStyle = {
    borderColor: "rgb(80,80,80)",
    backgroundColor: "rgb(80,80,80)"
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <TopBar />
        <Divider />
      </div>
      <div className={styles.contents}>
        <ReflexContainer orientation="vertical">
          <ReflexElement flex={0.2}>
            <ProjectTree />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={0.5}>
            <Explorer />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={0.3}>
            <Details />
          </ReflexElement>
        </ReflexContainer>
      </div>
    </div>
  );
}
