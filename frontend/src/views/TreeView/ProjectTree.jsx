import React, {useEffect, useState, useContext} from "react";
import ProjectTreeView from "./ProjectTreeView";
import Skeleton from '@mui/material/Skeleton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import styles from "./ProjectTree.module.css";
import serverRequest from "../../services/serverRequest";
import {ProjectContext} from "../../contexts/ProjectContext";

export default function ProjectTree() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState({});
  const [filterValue, setFilterValue] = useState("");
  const [updateTreeView, setUpdateTreeView] = useState(0);
  const [selectedProject, setSelectedProject] = useContext(ProjectContext);

  useEffect(() => {
    const data = {
      project: selectedProject
    };
    setIsLoading(true);
    serverRequest("get_project_tree", data).then((resp) => {
      setIsLoading(false);
      setLoadedData(resp.data);
    });
  }, [selectedProject, updateTreeView]);

  // function filterData(object, disabled){
  //   var childValue = false;
  //   if(object.hasOwnProperty('path') && object.path.includes(filterValue)) {
  //     disabled[object.id] = false;
  //   }
  //   // if (object.hasOwnProperty("children") && object.children.length === 0) {
  //   //   disabled[object.id] = true
  //   // }
  //   for(var i=0; i<Object.keys(object).length; i++){
  //       if(typeof object[Object.keys(object)[i]] == "object"){
  //         childValue = filterData(object[Object.keys(object)[i]], disabled);
  //         if (childValue) disabled[object[Object.keys(object)[i]].id] = false;
  //       }
  //   }
  //   if (!disabled.hasOwnProperty(object.id)) disabled[object.id] = true;
  // }

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
        <FormControl>
          <OutlinedInput
            id="outlined-basic"
            size="small"
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
