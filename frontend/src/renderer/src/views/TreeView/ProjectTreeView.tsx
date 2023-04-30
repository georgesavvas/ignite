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
import TreeItem, { TreeItemProps, treeItemClasses } from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import Box, { BoxProps } from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { EnqueueSnackbar } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";

import ContextMenu, { ContextMenuType, handleContextMenu } from "../../components/ContextMenu";
import DataPlaceholder from "../../components/DataPlaceholder";
import { DIRCONTEXTOPTIONS } from "../../constants/directoryContextOptions";
import { DIRECTORYICONS } from "../../constants/directoryIcons";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import { EntityContext, EntityContextType } from "../../contexts/EntityContext";
import BuildFileURL from "../../services/BuildFileURL";
import serverRequest from "../../services/serverRequest";
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import { CreateDir, DeleteDir, RenameDir } from "../ContextActions";
import { ChangeTaskType } from "../ContextActions";
import styles from "./ProjectTreeView.module.css";

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    paddingRight: theme.spacing(0),
    paddingLeft: theme.spacing(0),
    fontWeight: theme.typography.fontWeightMedium,
    "&.Mui-expanded": {
      fontWeight: theme.typography.fontWeightRegular,
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    "&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused": {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: "var(--tree-view-color)",
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: "inherit",
      color: "inherit",
    },
  },
}));

type DirectoryDataType = {
  id: string;
  path: string;
  kind: keyof typeof DIRCONTEXTOPTIONS;
  name: string;
  handleClick: (action: string, data: any) => void;
};

const getGenericContextItems = (data: DirectoryDataType, enqueueSnackbar: EnqueueSnackbar) => {
  return [
    {
      label: "Copy path",
      fn: () => CopyToClipboard(data.path, enqueueSnackbar),
    },
    {
      label: "Open in file explorer",
      fn: () => ShowInExplorer(data.path, enqueueSnackbar),
      divider: true,
    },
    {
      label: "Rename",
      fn: () => data.handleClick("rename", data),
    },
    {
      label: "Delete",
      fn: () => data.handleClick("delete", data),
      divider: true,
    },
  ];
};

function getSpecificContextItems(data: DirectoryDataType) {
  const kindOptions = DIRCONTEXTOPTIONS[data.kind];
  const namedOptions =
    (kindOptions && kindOptions[data.name as keyof typeof kindOptions]) || kindOptions.default;
  return namedOptions.map((contextOption: any) => ({
    label: contextOption.label,
    value: contextOption.name,
    dir_path: data.path,
    fn: () =>
      data.handleClick(contextOption.action || "create", {
        ...data,
        method: contextOption.name,
        kind: contextOption.dir_kind,
      }),
  }));
}

interface StyledTreeItemProps extends TreeItemProps {
  bgColor?: string;
  labelIcon: BoxProps["component"];
  labelInfo: string;
  labelText: string;
  handleContextMenuSelection: (action: string, data: any) => void;
  dirpath: string;
  dirkind: keyof typeof DIRCONTEXTOPTIONS;
  tasktype: string;
}

const StyledTreeItem = (props: StyledTreeItemProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const {
    bgColor,
    color,
    labelIcon: LabelIcon,
    labelInfo,
    labelText,
    handleContextMenuSelection,
    ...other
  } = props;

  const handleClick = (action: string, data: any) => {
    handleContextMenuSelection(action, data);
    handleClose();
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const itemData = {
    path: props.dirpath,
    kind: props.dirkind,
    taskType: props.tasktype,
    name: labelText,
    handleClick: handleClick,
  };

  let contextItems = getGenericContextItems(itemData, enqueueSnackbar);
  contextItems = contextItems.concat(getSpecificContextItems(itemData));

  return (
    <div>
      <ContextMenu
        items={contextItems}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        title={props.labelText}
        subtitle={props.dirkind}
      />
      <StyledTreeItemRoot
        label={
          <Box
            onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
            sx={{ display: "flex", alignItems: "center", p: 0.1, pr: 0.8 }}
          >
            <Box
              component={LabelIcon}
              color="inherit"
              sx={{ height: "20px", width: "20px", mr: 1 }}
            />
            <Typography
              variant="body2"
              sx={{ textAlign: "left", fontWeight: "inherit", flexGrow: 1 }}
            >
              {labelText}
            </Typography>
            <Typography variant="caption" color="rgb(100,100,100)">
              {labelInfo}
            </Typography>
          </Box>
        }
        style={{
          "--tree-view-color": color,
          "--tree-view-bg-color": bgColor,
        }}
        {...other}
      />
    </div>
  );
};

StyledTreeItem.propTypes = {
  bgColor: PropTypes.string,
  color: PropTypes.string,
  labelIcon: PropTypes.elementType,
  labelInfo: PropTypes.string,
  labelText: PropTypes.string.isRequired,
};

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
    ContextContext
  ) as ContextContextType;
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const findNodeByPath = (
      object: TreeNodeType,
      result: TreeNodeType[],
      value: string,
      parents: string[]
    ) => {
      if (object.path && object.path === value) {
        result.push(object);
        return;
      }
      for (var i = 0; i < Object.keys(object).length; i++) {
        const child = object[Object.keys(object)[i] as keyof TreeNodeType];
        if (child !== null && typeof child === "object") {
          if (value.includes(child.path)) parents.push(child.id);
          findNodeByPath(child, result, value, parents);
        }
      }
    };

    const newPath = currentContext.path;
    if (!newPath) return;
    let result = [] as DirectoryDataType[];
    let parents = [] as string[];
    findNodeByPath(props.data.children, result, newPath, parents);
    const firstResult = result[0];
    if (result) {
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
        const child = object[Object.keys(object)[i] as keyof TreeNodeType];
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
    setCurrentContext(firstResult.path);
    setSelectedItems(nodeId);
    serverRequest("find", { path: firstResult.path }).then((resp) => {
      if (resp.data) setSelectedEntity(resp.data);
    });
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
        nodeId={nodes.id}
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
        <TreeView
          aria-label="file system navigator"
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          onNodeSelect={handleNodeSelect}
          onNodeToggle={handleNodeToggle}
          expanded={expandedItems}
          selected={selectedItems}
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
        </TreeView>
      </div>
    </div>
  );
};

export default ProjectTreeView;
