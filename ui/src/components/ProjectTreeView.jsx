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
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ScienceIcon from '@mui/icons-material/Science';
import CameraIcon from '@mui/icons-material/Camera';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import MovieIcon from '@mui/icons-material/Movie';
import ConstructionIcon from '@mui/icons-material/Construction';
import FolderIcon from '@mui/icons-material/Folder';
import FortIcon from '@mui/icons-material/Fort';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import {ContextContext} from "../contexts/ContextContext";
import CreateDirDialogue from "./CreateDirDialogue";

const projectIcon = () => {
  return (
    <Typography variant="h6" style={{marginRight: "6px"}}>/</Typography>
  )
}

const labelIcons = {
  directory: FolderIcon,
  project: projectIcon,
  phase: MovieIcon,
  build: ConstructionIcon,
  sequence: LocalMoviesIcon,
  shot: CameraIcon,
  task: AssignmentIcon,
  task_generic: AssignmentIcon,
  task_model: FortIcon,
  task_look: FormatPaintIcon,
  task_light: LightbulbIcon,
  task_anim: DirectionsRunIcon,
  task_rig: PrecisionManufacturingIcon,
  task_asset: UnarchiveIcon,
  task_fx: LocalFireDepartmentIcon,
  rnd: ScienceIcon,
}

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    // borderTopRightRadius: theme.spacing(2),
    // borderBottomRightRadius: theme.spacing(2),
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
      color: 'var(--tree-view-color)',
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      color: 'inherit',
    },
  },
  // [`& .${treeItemClasses.group}`]: {
  //   marginLeft: 0,
  //   [`& .${treeItemClasses.content}`]: {
  //     // paddingLeft: theme.spacing(4)
  //     paddingLeft: `calc(var(--node-depth) * ${theme.spacing(2)}px)`
  //   },
  // },
}));

const cOpts = {
  create_directory: {name: "create_dir", label: "Create directory", dir_kind: "directory"},
  create_build: {name: "create_build", label: "Create build", dir_kind: "build"},
  create_sequence: {name: "create_sequence", label: "Create sequence", dir_kind: "sequence"},
  create_shot: {name: "create_shot", label: "Create shot", dir_kind: "shot"},
  create_task: {name: "create_task", label: "Create task", dir_kind: "task"}
};

const dirContextOptions = {
  "project": [],
  "task": [cOpts.create_task],
  "directory": [cOpts.create_directory, cOpts.create_sequence, cOpts.create_shot, cOpts.create_build, cOpts.create_task],
  "phase": [cOpts.create_directory, cOpts.create_sequence, cOpts.create_shot, cOpts.create_build],
  "build": [cOpts.create_directory, cOpts.create_task],
  "sequence": [cOpts.create_directory, cOpts.create_shot],
  "shot": [cOpts.create_directory, cOpts.create_task]
}

function requestCreateDir(data) {
  const promise = fetch(
    "http://127.0.0.1:5000/api/v1/create_dir", {
      method: "POST",
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  )
  .then((resp) => {
    return resp.json();
  });
  return promise;
};

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

  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
          }
          : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
          // Other native context menus might behave different.
          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
          null,
    );
  };

  const handleClick = (dir_path, contextOption) => {
    props.onContextOpen(dir_path, contextOption);
    handleClose();
  }

  const handleClose = () => {
    setContextMenu(null);
  };

  return (
    <div>
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
            >
              {contextOption.label}
            </MenuItem>
          ))}
      </Menu>
      <StyledTreeItemRoot
        label={
          <Box onContextMenu={handleContextMenu} sx={{ display: 'flex', alignItems: 'center', p: 0.1, pr: 0.8 }}>
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

export default function ProjectTreeView(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [openDialogue, setOpenDialogue] = useState(false);
  const [expandedItems, setExpandedItems] = useState(["root"]);
  const [selectedItems, setSelectedItems] = useState("root");
  const [newDirData, setNewDirData] = useState({});
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  useEffect(() => {
    if (!currentContext.path) {
      handleNodeSelect(null, "root")
    }
  }, [])

  useEffect(() => {
    function findNodeByPath(object, result, value){
      if(object.hasOwnProperty("path") && object.path === value) {
        result.push(object);
        return;
      }
      for(var i=0; i<Object.keys(object).length; i++){
        const child = object[Object.keys(object)[i]]
          if(child !== null && typeof child === "object"){
              findNodeByPath(object[Object.keys(object)[i]], result, value);
          }
      }
    }

    const newPath = currentContext.path;
    var result = [];
    findNodeByPath(props.data.children, result, newPath);
    result = result[0];
    if (result) {
      const nodeId = result.id;
      setSelectedItems(nodeId);
      // if (!expandedItems.includes(nodeId)) {
      //   setExpandedItems(prevState => [...prevState, nodeId]);
      // }
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
    var result = [];
    findNodeById(props.data, result, nodeId);
    result = result[0];
    console.log(props.data);
    setCurrentContext({
      path: result.path,
      name: result.name,
      kind: result.dir_kind
    });
    setSelectedItems(nodeId);
  };

  const handleNodeToggle = (event, nodeIds) => {
    setExpandedItems(nodeIds);
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
    requestCreateDir(data).then((resp => {
      props.shouldUpdate(prevState => prevState + 1);
    }));
  }

  const renderTree = (nodes) => (
    <StyledTreeItem
      key={nodes.id}
      nodeId={nodes.id}
      labelText={nodes.name}
      labelIcon={labelIcons[nodes.icon]}
      labelInfo={nodes.dir_kind}
      dir_kind={nodes.dir_kind}
      dir_path={nodes.path}
      onContextOpen={handleContextMenuSelection}
    >
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </StyledTreeItem>
  );

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
