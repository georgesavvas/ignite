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
import { DIRECTORYICONS, DIRCONTEXTOPTIONS } from "../../constants";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import { DeleteDir, RenameDir, CreateDir } from "../ContextActions";
import { useSnackbar } from 'notistack';
import { ConfigContext } from "../../contexts/ConfigContext";
import BuildFileURL from "../../services/BuildFileURL";

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

function getGenericContextItems(data, enqueueSnackbar) {
  return [
    {
      label: "Copy path",
      fn: () =>  CopyToClipboard(data.path, enqueueSnackbar)
    },
    {
      label: "Open in file explorer",
      fn: () => ShowInExplorer(data.path, enqueueSnackbar),
      divider: true
    },
    {
      label: "Rename",
      fn: () => data.handleClick("rename", data)
    },
    {
      label: "Delete",
      fn: () => data.handleClick("delete", data),
      divider: true
    }
  ]
}

function getSpecificContextItems(data) {
  return DIRCONTEXTOPTIONS[data.kind].map(contextOption => (
    {
      label: contextOption.label,
      value: contextOption.name,
      dir_path: data.path,
      fn: () => data.handleClick(
        "create", {...data, method: contextOption.name, kind: contextOption.dir_kind}
      )
    }
  ))
}

function StyledTreeItem(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

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

  const handleClick = (action, data) => {
    props.onContextOpen(action, data);
    handleClose();
  }

  const handleClose = () => {
    setContextMenu(null);
  };

  const itemData = {
    path: props.dir_path,
    kind: props.dir_kind,
    name: labelText,
    handleClick: handleClick
  }

  let contextItems = getGenericContextItems(itemData, enqueueSnackbar);
  contextItems = contextItems.concat(getSpecificContextItems(itemData));

  return (
    <div>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
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
  const [config, setConfig] = useContext(ConfigContext);
  const [expandedItems, setExpandedItems] = useState(["root"]);
  const [modalData, setModalData] = useState({});
  const [selectedItems, setSelectedItems] = useState("root");
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

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
    if(iconClicked || nodeIds.length > expandedItems.length) {
      setExpandedItems(nodeIds);
    }
  }

  const handleContextMenuSelection = (action, data) => {
    data[`${action}Open`] = true;
    setModalData(data);
  };

  const renderTree = (nodes) => {
    const filter_string = nodes.filter_strings.join(" ")
    const hide = props.filter && !filter_string.includes(props.filter);
    const path = BuildFileURL(nodes.path, config, {pathOnly: true});
    return (
      <StyledTreeItem
        key={nodes.id}
        nodeId={nodes.id}
        labelText={nodes.name}
        labelIcon={DIRECTORYICONS[nodes.icon]}
        labelInfo={nodes.dir_kind}
        dir_kind={nodes.dir_kind}
        dir_path={path}
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
      <CreateDir open={modalData.createOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, createOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      <DeleteDir open={modalData.deleteOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, deleteOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      <RenameDir open={modalData.renameOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, renameOpen: false}))}
        data={modalData} fn={refreshContext}
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
          {renderTree(props.data)}
        </TreeView>
      </div>
    </div>
  );
}

export default ProjectTreeView;
