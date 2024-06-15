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

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";

import DataPlaceholder from "../../components/DataPlaceholder";
import { DIRCONTEXTOPTIONS } from "../../constants/directoryContextOptions";
import { DIRECTORYICONS } from "../../constants/directoryIcons";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import { EntityContext, EntityContextType } from "../../contexts/EntityContext";
import BuildFileURL from "../../services/BuildFileURL";
import serverRequest from "../../services/serverRequest";
import { CreateDir, DeleteDir, RenameDir } from "../ContextActions";
import { ChangeTaskType } from "../ContextActions";
import styles from "./ProjectTreeView.module.css";
import StyledTreeItem from "./StyledTreeItem";

type ModalDataType = {
  createOpen?: boolean;
  deleteOpen?: boolean;
  renameOpen?: boolean;
  changeTaskTypeOpen?: boolean;
};

export type TreeNodeType = {
  id: string;
  filter_strings: string[];
  icon: keyof typeof DIRECTORYICONS;
  dir_kind: keyof typeof DIRCONTEXTOPTIONS;
  task_type: string;
  path: string;
  name: string;
  children: TreeNodeType;
};

interface ProjectTreeViewProps {
  filter: string;
  data: TreeNodeType;
}

const ProjectTreeView = (props: ProjectTreeViewProps) => {
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const { setSelectedEntity } = useContext(EntityContext) as EntityContextType;
  const [expandedItems, setExpandedItems] = useState(["root"]);
  const [modalData, setModalData] = useState<ModalDataType>({});
  const [selectedItems, setSelectedItems] = useState("root");
  const { currentContext, setCurrentContext, refresh } = useContext(
    ContextContext,
  ) as ContextContextType;
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const findNodeByPath = (
      object: TreeNodeType,
      result: TreeNodeType[],
      value: string,
      parents: string[],
    ) => {
      if (object.path && object.path === value) {
        result.push(object);
        return;
      }
      for (var i = 0; i < Object.keys(object).length; i++) {
        const child = object[Object.keys(object)[i] as keyof TreeNodeType] as TreeNodeType;
        if (child !== null && typeof child === "object") {
          if (value.includes(child.path)) parents.push(child.id);
          findNodeByPath(child, result, value, parents);
        }
      }
    };

    const newPath = currentContext.path;
    if (!newPath) return;
    let result = [] as TreeNodeType[];
    let parents = [] as string[];
    findNodeByPath(props.data.children, result, newPath, parents);
    const firstResult = result[0];
    if (firstResult) {
      const nodeId = firstResult.id;
      setSelectedItems(nodeId);
      if (!expandedItems.includes(nodeId)) {
        setExpandedItems((prev) => [...prev, ...parents, nodeId]);
      }
    }
  }, [currentContext]);

  const handleNodeSelect = (e: React.SyntheticEvent<Element, Event>, nodeId: string) => {
    const findNodeById = (object: TreeNodeType, result: TreeNodeType[], value: string) => {
      if (object.id && object.id === value) {
        result.push(object);
        return;
      }
      for (var i = 0; i < Object.keys(object).length; i++) {
        const child = object[Object.keys(object)[i] as keyof TreeNodeType] as TreeNodeType;
        if (child !== null && typeof child === "object") {
          findNodeById(child, result, value);
        }
      }
    };

    let iconClicked = (e.target as HTMLElement).closest(".MuiTreeItem-iconContainer");
    if (iconClicked) return;

    let result = [] as TreeNodeType[];
    findNodeById(props.data, result, nodeId);
    const firstResult = result[0];
    if (firstResult) {
      setCurrentContext(firstResult.path);
      setSelectedItems(nodeId);
      serverRequest("find", { path: firstResult.path }).then((resp) => {
        if (resp.data) setSelectedEntity(resp.data);
      });
    }
  };

  const handleNodeToggle = (e: React.SyntheticEvent<Element, Event>, nodeIds: string[]) => {
    let iconClicked = (e.target as HTMLElement).closest(".MuiTreeItem-iconContainer");
    if (iconClicked || nodeIds.length > expandedItems.length) {
      setExpandedItems(nodeIds);
    }
  };

  const handleContextMenuSelection = (action: string, data: any) => {
    data[`${action}Open`] = true;
    setModalData(data);
  };

  const renderTree = (nodes: TreeNodeType) => {
    const filterString = nodes.filter_strings.join(" ");
    const hide = props.filter && !filterString.includes(props.filter);
    const path = BuildFileURL(nodes.path, config, { pathOnly: true });
    if (nodes.id === "root" && hide) return;
    return (
      <StyledTreeItem
        key={nodes.id}
        itemId={nodes.id}
        labelText={nodes.name}
        labelIcon={DIRECTORYICONS[nodes.icon] || DIRECTORYICONS.directory}
        labelInfo={nodes.dir_kind}
        dirkind={nodes.dir_kind}
        tasktype={nodes.task_type}
        dirpath={path}
        handleContextMenuSelection={handleContextMenuSelection}
        style={hide ? { display: "none" } : {}}
      >
        {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
      </StyledTreeItem>
    );
  };

  return (
    <div className={styles.container}>
      <CreateDir
        open={modalData.createOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, createOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <DeleteDir
        open={modalData.deleteOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, deleteOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <RenameDir
        open={modalData.renameOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, renameOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <ChangeTaskType
        open={modalData.changeTaskTypeOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, changeTaskTypeOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <div className={styles.treeContainer}>
        <SimpleTreeView
          aria-label="file system navigator"
          onItemSelectionToggle={handleNodeSelect}
          onExpandedItemsChange={handleNodeToggle}
          expandedItems={expandedItems}
          selectedItems={selectedItems}
          sx={{
            flexGrow: 1,
            maxWidth: 800,
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          {renderTree(props.data) || (
            <DataPlaceholder text="No results" style={{ height: "90%", width: "90%" }} />
          )}
        </SimpleTreeView>
      </div>
    </div>
  );
};

export default ProjectTreeView;
