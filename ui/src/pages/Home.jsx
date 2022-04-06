import ReactSplit, { SplitDirection } from '@devbookhq/splitter'
import ProjectTree from '../components/ProjectTree';
import TopBar from "../components/TopBar";
import styles from "./Home.module.css";
import Explorer from "../components/Explorer";
import { Divider } from '@mui/material';

export default function Home() {
  return (
    <div className={styles.container}>
      <TopBar />
      <Divider />
      <ReactSplit 
        direction={SplitDirection.Horizontal}
        initialSizes={[20, 50, 30]}
        minWidths={[300, 650, 400]}
        gutterClassName={styles.gutterHorizontal}
        draggerClassName={styles.dragger}
      >
        <div className={styles.projectTree}>
          <ProjectTree />
        </div>
        <div className={styles.explorer}>
          <Explorer />
        </div>
        <div className={styles.assetViewer} />
      </ReactSplit>
    </div>
  );
  }