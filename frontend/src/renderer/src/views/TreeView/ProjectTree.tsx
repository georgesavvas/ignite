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

import { useContext, useEffect, useState } from "react";

import FilterField from "../../components/FilterField";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import serverRequest from "../../services/serverRequest";
import styles from "./ProjectTree.module.css";
import ProjectTreeView, { TreeNodeType } from "./ProjectTreeView";

export const ProjectTree = () => {
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [loadedData, setLoadedData] = useState<TreeNodeType>();
  const [filterValue, setFilterValue] = useState("");
  const { currentContext } = useContext(ContextContext) as ContextContextType;

  useEffect(() => {
    if (!config.ready) return;
    if (!Object.entries(config.access).length) return;
    const data = {
      project: currentContext.project,
    };
    serverRequest("get_project_tree", data).then((resp) => {
      setLoadedData(resp.data);
    });
  }, [currentContext, config.access]);

  var content = null;
  if (loadedData && loadedData.children) {
    content = <ProjectTreeView data={loadedData} filter={filterValue} />;
  }

  return (
    <div className={styles.container}>
      <FilterField filterValue={filterValue} setFilterValue={setFilterValue} />
      {content}
    </div>
  );
};

export default ProjectTree;
