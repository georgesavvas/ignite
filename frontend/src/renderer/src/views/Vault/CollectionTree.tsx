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
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { TreeView } from "@mui/x-tree-view";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view";
import { useSnackbar } from "notistack";
import PropTypes from "prop-types";
import { memo, useEffect, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";

import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import FilterField from "../../components/FilterField";
import serverRequest from "../../services/serverRequest";
import { CopyToClipboard } from "../ContextActions";
import { TreeNodeType } from "../TreeView/ProjectTreeView";
import StyledTreeItem from "../TreeView/StyledTreeItem";
import styles from "./CollectionTree.module.css";
import { CreateColl, DeleteColl, EditColl, RenameColl } from "./Modals";

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

const getContextItems = (data, enqueueSnackbar) => {
  const isRoot = data.path === "/all";
  return [
    {
      label: "Create",
      fn: () => data.handleClick("create", data),
    },
    {
      label: "Edit",
      disabled: isRoot,
      fn: () => data.handleClick("edit", data),
    },
    {
      label: "Rename",
      disabled: isRoot,
      fn: () => data.handleClick("rename", data),
    },
    {
      label: "Delete",
      disabled: isRoot,
      fn: () => data.handleClick("delete", data),
      divider: true,
    },
    {
      label: "Copy collection name",
      fn: () => CopyToClipboard(data.name, enqueueSnackbar),
    },
  ];
};

const CollectionTree = (props) => {
  const [expandedItems, setExpandedItems] = useState(["/all"]);
  const [selectedItems, setSelectedItems] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [filterValue, setFilterValue] = useState("");
  const [modalData, setModalData] = useState({});
  const [dropPreviewData, setDropPreviewData] = useState({ opacity: 0, top: 0, height: 20 });

  const scope = props.user ? "user" : "studio";

  useEffect(() => {
    if (!props.selectedCollection) return;
    const [selectedScope, selectedPath] = ["studio", props.selectedCollection];
    if (scope !== selectedScope) {
      setSelectedItems([]);
      return;
    }
    setSelectedItems(selectedPath);
  }, [props.selectedCollection]);

  const collectionInfo = {
    name: "",
    path: "/",
    user: props.user,
    scope: scope,
  };

  const treeContextItems = [
    {
      label: "Create",
      fn: () => handleContextMenuSelection("create", collectionInfo),
    },
  ];

  const handleNodeSelect = (event, nodeId) => {
    let iconClicked = event.target.closest(".MuiTreeItem-iconContainer");
    if (iconClicked) return;

    let result = [];
    let parents = [];
    findNodeByPath(props.collectionData, result, nodeId, parents);
    result = result[0];
    props.setSelectedCollection(result);
    setSelectedItems(nodeId);
    props.onFilterChange({ collection: result.expression });
  };

  const handleNodeToggle = (event, nodeIds) => {
    let iconClicked = event.target.closest(".MuiTreeItem-iconContainer");
    if (iconClicked || nodeIds.length > expandedItems.length) {
      setExpandedItems(nodeIds);
    }
  };

  const handleContextMenuSelection = (action, collectionInfo) => {
    collectionInfo[`${action}Open`] = true;
    setModalData(collectionInfo);
  };

  const handleReOrder = (source, target, offset) => {
    const data = {
      source: source,
      target: target,
      offset: offset,
      scope: scope,
      user: props.user,
    };
    serverRequest("reorder_collection", { data: data }).then((resp) => {
      if (resp.ok) enqueueSnackbar("Success!", { variant: "success" });
      else enqueueSnackbar("Error reordering collection.", { variant: "error" });
      props.onRefresh();
    });
  };

  const renderTree = (nodes) => {
    const filter_string = nodes.filter_strings.join(" ");
    const hide = filterValue && !filter_string.includes(filterValue);
    return (
      <StyledTreeItem
        key={nodes.path}
        id={nodes.path}
        name={nodes.name}
        labelInfo={nodes.dir_kind}
        path={nodes.path}
        expression={nodes.expression}
        handleContextMenuSelection={handleContextMenuSelection}
        style={hide ? { display: "none" } : undefined}
        onFocusCapture={(e) => e.stopPropagation()}
        custom={{ setdroppreviewdata: setDropPreviewData, onreorder: handleReOrder }}
        user={props.user}
        scope={scope}
      >
        {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
      </StyledTreeItem>
    );
  };

  const dropPreviewStyle = {
    opacity: dropPreviewData.opacity,
    top: dropPreviewData.top,
    left: dropPreviewData.left,
    height: dropPreviewData.height,
    width: dropPreviewData.width,
  };

  return (
    <div
      className={styles.container}
      onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
    >
      <div className={styles.dropPreview} style={dropPreviewStyle} />
      <ContextMenu
        items={treeContextItems}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <EditColl
        open={modalData.editOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, editOpen: false }))}
        data={modalData}
        fn={props.onRefresh}
      />
      <CreateColl
        open={modalData.createOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, createOpen: false }))}
        data={modalData}
        fn={props.onRefresh}
      />
      <DeleteColl
        open={modalData.deleteOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, deleteOpen: false }))}
        data={modalData}
        fn={props.onRefresh}
      />
      <RenameColl
        open={modalData.renameOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, renameOpen: false }))}
        data={modalData}
        fn={props.onRefresh}
      />
      <FilterField filterValue={filterValue} setFilterValue={setFilterValue} />
      <div className={styles.treeContainer}>
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          onNodeSelect={handleNodeSelect}
          onNodeToggle={handleNodeToggle}
          expanded={expandedItems}
          selected={selectedItems}
          sx={{ flexGrow: 1, overflowX: "hidden", overflowY: "auto" }}
        >
          {/* {renderTree(collectionData)} */}
          {props.collectionData.map((node) => renderTree(node))}
        </TreeView>
      </div>
    </div>
  );
};

export default CollectionTree;
