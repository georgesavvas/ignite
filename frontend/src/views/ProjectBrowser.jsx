import { createRef, useState, useContext, useEffect } from "react";
import styles from "./ProjectBrowser.module.css";
import Explorer from "./Explorer/Explorer";
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import {setProject, ContextContext} from "../contexts/ContextContext";
import Button from '@mui/material/Button';
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
}

const ProjectTile = (props) => {
  const [progress, setProgress] = useState(0.5);
  const hoverArea = createRef();

  const tileStyle = {
    "borderColor": props.selected ? "rgb(252, 140, 3)" : "rgb(50, 50, 50)",
  };

  const thumbnailStyle = {
    width: "100%",
    height: "auto",
    margin: "auto",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    position: "absolute"
  };

  const barStyle = {
    "left": `${progress * 100}%`
  }

  const handleMouseMove = (e) => {
    const rect = hoverArea.current.getBoundingClientRect();
    const width = (e.clientX - rect.left) / rect.width;
    setProgress(clamp(width, 0, 1));
  }

  const handleClick = (e) => {
    props.onSelected(props.project);
  }

  function renderThumbnail(entity) {
    var path = "media/no_icon.png";
    path = "media/plane_crash.png";
    return <img src={path} style={thumbnailStyle} />;
  }

  return (
    <div style={tileStyle} className={styles.tile} onClick={handleClick} >
      {renderThumbnail(props.entity)}
      <div className={styles.hoverArea} onMouseMove={handleMouseMove} ref={hoverArea}>
        <div className={styles.overlay}>
          {/* <div className={styles.topGrad} /> */}
          <div className={styles.bottomGrad} />
          <Typography style={{"position": "absolute", "bottom": "5px", "left": "10px"}}>{props.project.name}</Typography>
        </div>
        <div className={styles.bar} style={barStyle} />
      </div>
    </div>
  );
}

const testProjects = [
  {
    name: "Volt",
    result_id: 0
  },
  {
    name: "PlaneCrash",
    result_id: 1
  },
  {
    name: "Virgin Media Fibre",
    result_id: 2
  },
  {
    name: "test",
    result_id: 3
  },
  {
    name: "bbc_idents",
    result_id: 4
  },
  {
    name: "rnd",
    result_id: 5
  },
  {
    name: "MetaForester",
    result_id: 6
  },
]

const tileContainerStyle = {
  flexGrow: 1,
  display: "grid",
  overflowY: "auto",
  gridTemplateColumns: `repeat(auto-fill, minmax(250px, 1fr))`,
  // gridGap: `${tileSize * 0.06}px`,
  // padding: `${tileSize * 0.06}px`
  gridGap: "10px",
  padding: "10px"
}

const Browser = (props) => {
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState([]);
  const [tiles, setTiles] = useState([]);

  const handleSelection = project => {
    setProject(project.name, setCurrentContext);
    props.onClose();
  }

  useEffect(() => {
    if (!props.open) return;
    setIsLoading(true);
    fetch(
      "http://127.0.0.1:9090/api/v1/get_projects", {
        method: "GET",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      }
    )
    .then((resp) => {
      return resp.json();
    })
    .then((resp) => {
      setIsLoading(false);
      setLoadedData(resp.data);
    });
  }, [props.open]);

  useEffect(() => {
    const _tiles = loadedData.reduce(function(obj, project) {
      obj[project.result_id] = <ProjectTile key={project.result_id} project={project} onSelected={handleSelection} selected={""} />;
      return obj;
    }, {});
    setTiles(_tiles);
  }, [loadedData]);

  return (
    <div className={styles.container}>
      <div style={tileContainerStyle}>
        {Object.keys(tiles).map((k) => tiles[k])}
      </div>
      {/* <ReflexContainer orientation="vertical">
        <ReflexElement flex={0.2}>
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={0.7}>
        </ReflexElement>
      </ReflexContainer> */}
    </div>
  )
}

const dialogStyle = {
  "& .MuiDialog-container": {
    "& .MuiPaper-root": {
      width: "100%",
      maxWidth: "80vw",
      backgroundColor: "rgb(40,40,40)",
      backgroundImage: "none"
    },
  },
}

export default function ProjectBrowser(props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} sx={dialogStyle}>
      <DialogTitle>Project Browser</DialogTitle>
      <DialogContent>
        {Browser(props)}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
