// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useEffect, useState, useContext} from "react";

import styles from "./ProjectTree.module.css";
import serverRequest from "../../services/serverRequest";
import {ContextContext} from "../../contexts/ContextContext";
import {ConfigContext} from "../../contexts/ConfigContext";
import FilterField from "../../components/FilterField";
import ProjectTreeView from "./ProjectTreeView";


export default function ProjectTree() {
  const [config] = useContext(ConfigContext);
  const [loadedData, setLoadedData] = useState({});
  const [filterValue, setFilterValue] = useState("");
  const [updateTreeView, setUpdateTreeView] = useState(0);
  const [currentContext] = useContext(ContextContext);

  useEffect(() => {
    if (!config.ready) return;
    if (!Object.entries(config.access).length) return;
    const data = {
      project: currentContext.project
    };
    serverRequest("get_project_tree", data).then((resp) => {
      setLoadedData(resp.data);
    });
  }, [currentContext, config.access, updateTreeView]);

  var content = null;
  if (loadedData && loadedData.children) {
    content = <ProjectTreeView
      data={loadedData}
      shouldUpdate={setUpdateTreeView}
      filter={filterValue}
    />;
  }

  return (
    <div className={styles.container}>
      <FilterField filterValue={filterValue} setFilterValue={setFilterValue} />
      {content}
    </div>
  );
}
