import React, {useEffect, useState, useContext} from "react";
import PropTypes from 'prop-types';
import {styled} from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import styles from "./ProjectTreeView.module.css";
import TreeView from '@mui/lab/TreeView';
import TreeItem, {treeItemClasses} from '@mui/lab/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import {ContextContext} from "../../contexts/ContextContext";
import CreateDirDialogue from "../../components/CreateDirDialogue";
import { DIRECTORYICONS } from "../../constants";
import serverRequest from "../../services/serverRequest";
import ContextMenu, { handleContextMenu } from "./ContextMenu";

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    paddingRight: theme.spacing(0),
    paddingLeft: theme.spacing(0),
    fontWeight: theme.typography.fontWeightMedium,
    '&.Mui-expanded': {
      fontWeight: theme.typography.fontWeightRegular,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: 'var(--tree-view-color)'
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      color: 'inherit',
    },
  }
}));

const cOpts = {
  create_directory: {name: "create_dir", label: "Create directory", dir_kind: "directory"},
  create_build: {name: "create_build", label: "Create build", dir_kind: "build"},
  create_sequence: {name: "create_sequence", label: "Create sequence", dir_kind: "sequence"},
  create_shot: {name: "create_shot", label: "Create shot", dir_kind: "shot"},
  create_task: {name: "create_task", label: "Create task", dir_kind: "task"}
}

const dirContextOptions = {
  "project": [],
  "task": [cOpts.create_task],
  "directory": [cOpts.create_directory, cOpts.create_sequence, cOpts.create_shot, cOpts.create_build, cOpts.create_task],
  "phase": [cOpts.create_directory, cOpts.create_sequence, cOpts.create_shot, cOpts.create_build],
  "build": [cOpts.create_directory, cOpts.create_task],
  "sequence": [cOpts.create_directory, cOpts.create_shot],
  "shot": [cOpts.create_directory, cOpts.create_task]
}

function getGenericContextItems(data) {
  return [
    {
      label: "Copy path",
      fn: () =>  CopyToClipboard(data.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Open in file explorer",
      fn: () => openExplorer(data.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Rename",
      fn: () => handleRenameDir(data)
    },
    {
      label: "Delete",
      fn: () => handleDeleteDir(data),
      divider: true
    }
  ]
}

function handleRenameDir(data) {
  return serverRequest("rename_dir", data);
}

function handleDeleteDir(data) {
  return serverRequest("delete_dir", data);
}

function handleCreateDir(data) {
  return serverRequest("create_dir", data);
}

function StyledTreeItem(props) {
  const [contextMenu, setContextMenu] = useState(null);

  const {
    bgColor,
    color,
    depth = 2,
    labelIcon: LabelIcon,
    labelInfo,
    dir_path,
    dir_kind,
    onContextOpen,
    labelText,
    ...other
  } = props;

  const handleClick = (dir_path, contextOption) => {
    props.onContextOpen(dir_path, contextOption);
    handleClose();
  }

  const handleClose = () => {
    setContextMenu(null);
  };

  return (
    <div>
      <ContextMenu items={props.contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {dirContextOptions[props.dir_kind].map(contextOption => (
            <MenuItem
              key={contextOption.name}
              value={contextOption.name}
              dir_path={props.dir_path}
              onClick={(() => handleClick(
                props.dir_path,
                contextOption
              ))}
              style={{
                paddingTop: "2px",
                paddingBottom: "2px",
                fontSize: "0.8rem"
              }}
            >
              {contextOption.label}
            </MenuItem>
          ))}
      </Menu>
      <StyledTreeItemRoot
        label={
          <Box onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
            sx={{ display: 'flex', alignItems: 'center', p: 0.1, pr: 0.8 }}
          >
            <Box component={LabelIcon} color="inherit" sx={{ height: "20px", width: "20px", mr: 1 }} />
            <Typography variant="body2" sx={{ textAlign: 'left', fontWeight: 'inherit', flexGrow: 1 }}>
              {labelText}
            </Typography>
            <Typography variant="caption" color="rgb(100,100,100)">
              {labelInfo}
            </Typography>
          </Box>
        }
        style={{
          '--tree-view-color': color,
          '--tree-view-bg-color': bgColor
        }}
        {...other}
      />
    </div>
  );
};

StyledTreeItem.propTypes = {
  bgColor: PropTypes.string,
  color: PropTypes.string,
  labelIcon: PropTypes.elementType.isRequired,
  labelInfo: PropTypes.string,
  labelText: PropTypes.string.isRequired,
};

function ProjectTreeView(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [openDialogue, setOpenDialogue] = useState(false);
  const [expandedItems, setExpandedItems] = useState(["root"]);
  const [selectedItems, setSelectedItems] = useState("root");
  const [newDirData, setNewDirData] = useState({});
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  // useEffect(() => {
  //   if (!currentContext.path) {
  //     handleNodeSelect(null, "root")
  //   }
  // }, [])

  useEffect(() => {
    function findNodeByPath(object, result, value, parents){
      if(object.hasOwnProperty("path") && object.path === value) {
        result.push(object);
        return;
      }
      for(var i=0; i<Object.keys(object).length; i++){
        const child = object[Object.keys(object)[i]]
          if(child !== null && typeof child === "object"){
              if (value.includes(child.path)) parents.push(child.id);
              findNodeByPath(object[Object.keys(object)[i]], result, value, parents);
          }
      }
    }

    const newPath = currentContext.path;
    if (!newPath) return;
    let result = [];
    let parents = [];
    findNodeByPath(props.data.children, result, newPath, parents);
    result = result[0];
    if (result) {
      const nodeId = result.id;
      setSelectedItems(nodeId);
      if (!expandedItems.includes(nodeId)) {
        setExpandedItems(prevState => [...prevState, ...parents, nodeId]);
      }
    }
  }, [currentContext])

  const handleNodeSelect = (event, nodeId) => {
    function findNodeById(object, result, value){
      if(object.hasOwnProperty('id') && object.id === value) {
        result.push(object);
        return;
      }
      for(var i=0; i<Object.keys(object).length; i++){
        const child = object[Object.keys(object)[i]]
          if(child !== null && typeof child === "object"){
              findNodeById(object[Object.keys(object)[i]], result, value);
          }
      }
    }

    let iconClicked = event.target.closest(".MuiTreeItem-iconContainer")
    if(iconClicked) return;

    var result = [];
    findNodeById(props.data, result, nodeId);
    result = result[0];
    setCurrentContext(result.path);
    setSelectedItems(nodeId);
  };

  const handleNodeToggle = (event, nodeIds) => {
    let iconClicked = event.target.closest(".MuiTreeItem-iconContainer")
    if(iconClicked) {
      setExpandedItems(nodeIds);
    }
  }

  const handleContextMenuSelection = (dir_path, contextOption) => {
    const data = {
      path: dir_path,
      dir_kind: contextOption.dir_kind,
      method: contextOption.name,
      modal_title: contextOption.label
    };
    setNewDirData(data);
    setOpenDialogue(true);
  };

  const handleOnCreate = (dialogueData, meta) => {
    const data = {...meta, ...dialogueData};
    handleCreateDir(data).then((resp => {
      props.shouldUpdate(prevState => prevState + 1);
    }));
  }

  const renderTree = (nodes) => {
    const filter_string = nodes.filter_strings.join(" ")
    const hide = props.filter && !filter_string.includes(props.filter);
    return (
      <StyledTreeItem
        key={nodes.id}
        nodeId={nodes.id}
        labelText={nodes.name}
        labelIcon={DIRECTORYICONS[nodes.icon]}
        labelInfo={nodes.dir_kind}
        dir_kind={nodes.dir_kind}
        dir_path={nodes.path}
        onContextOpen={handleContextMenuSelection}
        style={hide ? {display: "none"} : null}
      >
        {Array.isArray(nodes.children)
          ? nodes.children.map((node) => renderTree(node))
          : null}
      </StyledTreeItem>
    )
  };

  return (
    <div className={styles.container}>
      <CreateDirDialogue
        open={openDialogue}
        meta={newDirData}
        onCreate={(v, data) => handleOnCreate(v, data)}
        onClose={() => setOpenDialogue(false)}
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
          sx={{ flexGrow: 1, maxWidth: 800, overflowX: "hidden", overflowY: 'auto' }}
        >
          {/* {props.data.children.map((node) => renderTree(node))} */}
          {renderTree(props.data)}
        </TreeView>
      </div>
    </div>
  );
}

export default ProjectTreeView;
