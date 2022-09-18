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
import ProjectCreator from "./ProjectCreator";

const tileContainerStyle = {
  flexGrow: 1,
  display: "grid",
  overflowY: "auto",
  gridTemplateColumns: `repeat(auto-fill, minmax(250px, 1fr))`,
  gridGap: "10px",
  padding: "10px"
}

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
}

const Browser = props => {
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState([]);
  const [tiles, setTiles] = useState([]);

  const handleSelection = entity => {
    setProject(entity.name, setCurrentContext);
    props.onClose();
  }

  useEffect(() => {
    if (!props.open) return;
    setIsLoading(true);
    serverRequest("get_projects").then(resp => {
      setIsLoading(false);
      setLoadedData(resp.data);
    });
  }, [props.open]);

  useEffect(() => {
    const _tiles = loadedData.reduce(function(obj, entity) {
      obj[entity.result_id] = <ProjectTile key={entity.result_id} viewType="grid"
                                entity={entity} onSelected={handleSelection}
                                selected={""}
                              />;
      return obj;
    }, {});
    setTiles(_tiles);
  }, [loadedData]);

  return (
    <div className={styles.container}>
      <ReflexContainer orientation="vertical" style={{height: "90vh"}}>
        <ReflexElement flex={0.7}>
          <div style={tileContainerStyle}>
            {Object.keys(tiles).map((k) => tiles[k])}
          </div>
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={0.3}>
          <ProjectCreator />
        </ReflexElement>
      </ReflexContainer>
    </div>
  )
}

export default function ProjectBrowser(props) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Project Browser" fullWidth
    closeButton>
      {Browser(props)}
    </Modal>
  )
}
