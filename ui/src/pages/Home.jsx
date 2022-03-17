import ReactSplit, { SplitDirection } from '@devbookhq/splitter'
import ProjectTree from '../components/ProjectTree';
import ProjectBar from "../components/ProjectBar";
import styles from "./Home.module.css" 

export default function Home() {
  return (
    <div className={styles.container}>
      <ReactSplit
        direction={SplitDirection.Vertical}
        initialSizes={[5, 95]}
        gutterClassName={styles.gutterVertical}
        draggerClassName={styles.dragger}
      >
        <ProjectBar />
        <ReactSplit 
          direction={SplitDirection.Horizontal}
          initialSizes={[20, 50, 30]}
          gutterClassName={styles.gutterHorizontal}
          draggerClassName={styles.dragger}
        >
          <div className={styles.projectTree}>
            <ProjectTree />
          </div>
          <div className={styles.explorer} />
          <div className={styles.assetViewer} />
        </ReactSplit>
      </ReactSplit>
    </div>
  );
  }