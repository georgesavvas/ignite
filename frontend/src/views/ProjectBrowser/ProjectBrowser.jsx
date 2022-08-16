import { createRef, useState, useContext, useEffect } from "react";
import styles from "./ProjectBrowser.module.css";
import Typography from '@mui/material/Typography';
import {setProject, ContextContext} from "../../contexts/ContextContext";
import Button from '@mui/material/Button';
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import serverRequest from "../../services/serverRequest";
import { ConfigContext } from "../../contexts/ConfigContext";
import Modal from "../../components/Modal";
import ProjectTile from "./ProjectTile";

const tileContainerStyle = {
  flexGrow: 1,
  display: "grid",
  overflowY: "auto",
  gridTemplateColumns: `repeat(auto-fill, minmax(250px, 1fr))`,
  gridGap: "10px",
  padding: "10px"
}

const Browser = props => {
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
    serverRequest("get_projects").then(resp => {
      console.log(resp.data);
      setIsLoading(false);
      setLoadedData(resp.data);
    });
  }, [props.open]);

  useEffect(() => {
    const _tiles = loadedData.reduce(function(obj, entity) {
      obj[entity.result_id] = <ProjectTile key={entity.result_id} entity={entity} onSelected={handleSelection} selected={""} />;
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

export default function ProjectBrowser(props) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Vault" maxWidth="lg"
    closeButton>
      {Browser(props)}
    </Modal>
  )
}
