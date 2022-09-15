import React, {useEffect, useState, useContext} from "react";
import ProjectTreeView from "./ProjectTreeView";
import Skeleton from '@mui/material/Skeleton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import styles from "./ProjectTree.module.css";
import serverRequest from "../../services/serverRequest";
import {ContextContext} from "../../contexts/ContextContext";
import { ConfigContext } from "../../contexts/ConfigContext";

export default function ProjectTree() {
  const [config, setConfig] = useContext(ConfigContext);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState({});
  const [filterValue, setFilterValue] = useState("");
  const [updateTreeView, setUpdateTreeView] = useState(0);
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);

  useEffect(() => {
    if (!config.access) return;
    if (!Object.entries(config.access).length) return;
    const data = {
      project: currentContext.project
    };
    setIsLoading(true);
    serverRequest("get_project_tree", data).then((resp) => {
      setIsLoading(false);
      setLoadedData(resp.data);
    });
  }, [currentContext, config.access, updateTreeView]);

  var content = null;
  if (loadedData && loadedData.children) {
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
