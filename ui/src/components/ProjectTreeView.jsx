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
import {ContextContext} from "../contexts/ContextContext";
import TextFieldDialogue from "./TextFieldDialogue";

const labels = {
  directory: FolderIcon,
  project: MovieIcon,
  phase: MovieIcon,
  build: ConstructionIcon,
  sequence: LocalMoviesIcon,
  shot: CameraIcon,
  task: AssignmentIcon,
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
  create_directory: {name: "create_dir", label: "Create directory"},
  create_build: {name: "create_build", label: "Create build"},
  create_sequence: {name: "create_sequence", label: "Create sequence"},
  create_shot: {name: "create_shot", label: "Create shot"},
  create_task: {name: "create_task", label: "Create task"}
};

const dirContextOptions = {
  "project": [],
  "task": [cOpts.create_directory],
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

  const handleClick = (dir_path, dir_kind) => {
    props.onContextOpen(dir_path, dir_kind);
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
            <MenuItem key={contextOption.name} value={contextOption.name} dir_path={props.dir_path} onClick={(() => handleClick(props.dir_path, contextOption.name))}>{contextOption.label}</MenuItem>
          ))}
      </Menu>
      <StyledTreeItemRoot
        label={
          <Box onContextMenu={handleContextMenu} sx={{ display: 'flex', alignItems: 'center', p: 0.1, pr: 0.8 }}>
            <Box component={LabelIcon} color="inherit" sx={{ height: "20px", width: "20px", mr: 1 }} />
            <Typography variant="body2" sx={{ textAlign: 'left', fontWeight: 'inherit', flexGrow: 1 }}>
              {labelText}
            </Typography>
            <Typography variant="caption" color="inherit">
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
  const [newDirData, setNewDirData] = useState({});
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  const handleNodeSelect = (event, nodeIds) => {
    function findNodeById(object, result, value){
      if(object.hasOwnProperty('id') && object.id === value) {
        result.push(object);
        return;
      }
      for(var i=0; i<Object.keys(object).length; i++){
          if(typeof object[Object.keys(object)[i]] === "object"){
              findNodeById(object[Object.keys(object)[i]], result, value);
          }
      }
    }
    var result = [];
    findNodeById(props.data.children, result, nodeIds);
    result = result[0];
    setCurrentContext({
      path: result.path,
      name: result.name,
      kind: result.kind
    });
  };

  const handleContextMenuSelection = (dir_path, method) => {
    const data = {
      path: dir_path,
      method: method
    };
    setNewDirData(data);
    setOpenDialogue(true);
  };

  const handleOnCreate = (dir_name, data) => {
    data.dir_name = dir_name;
    requestCreateDir(data).then((resp => {
      props.shouldUpdate(prevState => prevState + 1);
    }));
  }

  const renderTree = (nodes) => (
    <StyledTreeItem
      key={nodes.id}
      nodeId={nodes.id}
      labelText={nodes.name}
      labelIcon={labels[nodes.kind]}
      labelInfo={nodes.kind}
      dir_kind={nodes.kind}
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
      <TextFieldDialogue
        open={openDialogue}
        meta={newDirData}
        onCreate={(v, data) => handleOnCreate(v, data)}
        onClose={() => setOpenDialogue(false)}
        title={"Create directory"}
        info="Info"
        label="Directory name:"
      />
      <div className={styles.treeContainer}>
        <TreeView
          aria-label="file system navigator"
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          onNodeSelect={handleNodeSelect}
          sx={{ flexGrow: 1, maxWidth: 800, overflowX: "hidden", overflowY: 'auto' }}
        >
          {props.data.children.map((node) => renderTree(node))}
        </TreeView>
      </div>
    </div>
  );
}
