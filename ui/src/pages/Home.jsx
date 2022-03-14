import ReactSplit, { SplitDirection } from '@devbookhq/splitter'
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
        <div className={styles.projectBar}>sup</div>
        <ReactSplit 
          direction={SplitDirection.Horizontal}
          initialSizes={[20, 50, 30]}
          gutterClassName={styles.gutterHorizontal}
          draggerClassName={styles.dragger}
        >
          <div className={styles.projectTree} />
          <div className={styles.explorer} />
          <div className={styles.assetViewer} />
        </ReactSplit>
      </ReactSplit>
    </div>
  );
  }