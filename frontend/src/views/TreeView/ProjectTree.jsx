import React, {useEffect, useState, useContext} from "react";
import ProjectTreeView from "./ProjectTreeView";
import Skeleton from '@mui/material/Skeleton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import styles from "./ProjectTree.module.css";
import serverRequest from "../../services/serverRequest";
import {ContextContext} from "../../contexts/ContextContext";

export default function ProjectTree() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState({});
  const [filterValue, setFilterValue] = useState("");
  const [updateTreeView, setUpdateTreeView] = useState(0);
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  useEffect(() => {
    const data = {
      project: currentContext.project
    };
    setIsLoading(true);
    serverRequest("get_project_tree", data).then((resp) => {
      setIsLoading(false);
      setLoadedData(resp.data);
    });
  }, [currentContext.project, updateTreeView]);

  var content = [];
  if (loadedData.children === undefined) {
    content = <Skeleton
        variant="rectangular"
        animation="wave"
        className={styles.skeleton}
      />;
  } else {
    // var filteredData = Object.assign({}, loadedData);;
    // var disabled = {};
    // filterData(filteredData, disabled);
    content = <ProjectTreeView data={loadedData} shouldUpdate={setUpdateTreeView} filter={filterValue} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <FormControl fullWidth>
          <OutlinedInput
            id="outlined-basic"
            size="small"
            fullWidth
            placeholder="Filter"
            value={filterValue}
            onChange={e => setFilterValue(e.target.value || "")}
          />
        </FormControl>
      </div>
      {content}
    </div>
  );
}
