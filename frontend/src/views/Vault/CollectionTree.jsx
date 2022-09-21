import TreeView from "@mui/lab/TreeView"
import TreeItem, {treeItemClasses} from "@mui/lab/TreeItem"
import {styled} from "@mui/material/styles"
import Box from "@mui/material/Box"
import PropTypes from "prop-types"
import Typography from "@mui/material/Typography"
import React, { useEffect, useState, memo, useMemo, useRef } from "react"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import styles from "./CollectionTree.module.css"
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu"
import { useSnackbar } from "notistack"
import { CopyToClipboard, ShowInExplorer } from "../ContextActions"
import { CreateColl, RenameColl, DeleteColl, EditColl } from "./Modals"
import FormControl from "@mui/material/FormControl"
import OutlinedInput from "@mui/material/OutlinedInput"
import { useDrag, useDrop } from "react-dnd"
import serverRequest from "../../services/serverRequest"

const ICONS = {

}

function findNodeByPath(object, result, value, parents) {
  if(object.hasOwnProperty("path") && object.path === value) {
    result.push(object)
    return;
  }
  for(var i=0; i<Object.keys(object).length; i++){
    const child = object[Object.keys(object)[i]]
      if(child !== null && typeof child === "object"){
          if (value.includes(child.path)) parents.push(child.id)
          findNodeByPath(object[Object.keys(object)[i]], result, value, parents)
      }
  }
}

// function findNodeById(object, result, value) {
//   if(object.hasOwnProperty('id') && object.path === value) {
//     result.push(object);
//     return;
//   }
//   for(var i=0; i<Object.keys(object).length; i++){
//     const child = object[Object.keys(object)[i]]
//       if(child !== null && typeof child === "object"){
//           findNodeById(object[Object.keys(object)[i]], result, value);
//       }
//   }
// }

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
      color: "var(--tree-view-color)"
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: "inherit",
      color: "inherit",
    },
  }
}))

const shouldBeDisabled = (scope, path) => {
  if (scope !== "studio") return
  if (path.startsWith("/all/2d/elements") || path.startsWith("/all/projects")) {
    return true
  }
  if (path == "/all") return true
}

function getContextItems(data, enqueueSnackbar) {
  const disabled = shouldBeDisabled(data.scope, data.path)
  return [
    {
      label: "Create",
      disabled: disabled,
      fn: () =>  data.handleClick("create", data)
    },
    {
      label: "Edit",
      disabled: disabled,
      fn: () =>  data.handleClick("edit", data)
    },
    {
      label: "Rename",
      disabled: disabled,
      fn: () =>  data.handleClick("rename", data)
    },
    {
      label: "Delete",
      disabled: disabled,
      fn: () => data.handleClick("delete", data),
      divider: true
    },
    {
      label: "Copy collection name",
      fn: () =>  CopyToClipboard(data.name, enqueueSnackbar)
    },
    // {
    //   label: "Copy asset ids",
    //   fn: () =>  CopyToClipboard("", enqueueSnackbar)
    // },
    // {
    //   label: "Copy asset names",
    //   fn: () =>  CopyToClipboard("", enqueueSnackbar)
    // },
    // {
    //   label: "Copy asset paths",
    //   fn: () =>  CopyToClipboard("", enqueueSnackbar)
    // },
  ]
}

const StyledTreeItem = memo(function StyledTreeItem(props) {
  const [contextMenu, setContextMenu] = useState(null)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const ref = useRef(null)
  // const [{ isOver, canDrop }, drop] = useDrop(() => ({
  //     accept: "collection",
  //     drop: item => console.log(item.path, "was just dropped on", props.path),
  //     canDrop: item => item.path !== props.path,
  //     collect: monitor => ({
  //       isOver: !!monitor.isOver(),
  //       canDrop: !!monitor.canDrop()
  //     })
  //   })
  // )

  const [{ handlerId }, drop] = useDrop({
    accept: "collection",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      }
    },
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      props.custom.setdroppreviewdata({
        opacity: 1,
        top: hoverBoundingRect.top - 2,
        left: hoverBoundingRect.left - 5,
        height: hoverBoundingRect.height,
        width: hoverBoundingRect.width
      })
    },
    drop(item, monitor) {
      if (!ref.current) {
        return
      }
      props.custom.onreorder(item.path, props.path, 0)
    }
  })

  const [{isDragging}, drag] = useDrag(() => ({
    type: "collection",
    item: () => {return {path: props.path}},
    end: () => {props.custom.setdroppreviewdata({opacity: 0})},
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))
  drag(drop(ref))

  const {
    bgColor,
    color,
    depth = 2,
    labelIcon: LabelIcon,
    labelInfo,
    path,
    dynamic,
    onContextOpen,
    name,
    ...other
  } = props

  const handleClick = (action, data) => {
    props.onContextOpen(action, data)
    handleClose()
  }

  const handleClose = () => {
    setContextMenu(null)
  };

  const itemData = {
    path: props.path,
    dynamic: props.dynamic,
    name: name,
    expression: props.expression,
    user: props.user,
    scope: props.scope,
    handleClick: handleClick
  }

  let contextItems = getContextItems(itemData, enqueueSnackbar)

  const onContextMenu = e => {
    e.stopPropagation()
    handleContextMenu(e, contextMenu, setContextMenu)
  }

  return (
    <div>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <StyledTreeItemRoot
        label={
          <Box onContextMenu={onContextMenu} ref={ref}
            sx={{ display: "flex", alignItems: "center", p: 0.1, pr: 0.8 }} 
          >
            {/* <Box component={LabelIcon} color="inherit" sx={{ height: "20px", width: "20px", mr: 1 }} /> */}
            <Typography variant="body2" sx={{ textAlign: "left", fontWeight: "inherit", flexGrow: 1 }}>
              {name}
            </Typography>
            <Typography variant="caption" color="rgb(100,100,100)">
              {labelInfo}
            </Typography>
          </Box>
        }
        style={{
          "--tree-view-color": color,
          "--tree-view-bg-color": bgColor
        }}
        {...other}
      />
    </div>
  )
})

StyledTreeItem.propTypes = {
  bgColor: PropTypes.string,
  color: PropTypes.string,
  labelIcon: PropTypes.elementType,
  labelInfo: PropTypes.string,
  name: PropTypes.string.isRequired
}

function CollectionTree({collectionData, selectedCollection, setSelectedCollection, onRefresh, user}) {
  const [expandedItems, setExpandedItems] = useState(["/all", "/all/2d", "/add/3d"])
  const [selectedItems, setSelectedItems] = useState("")
  const [contextMenu, setContextMenu] = useState(null)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const [filterValue, setFilterValue] = useState("")
  const [modalData, setModalData] = useState({})
  const [dropPreviewData, setDropPreviewData] = useState({opacity: 0, top: 0, height: 20})

  const scope = user ? "user" : "studio"

  // useEffect(() => {
  //   setSelectedItems("/all");
  // }, [])

  useEffect(() => {
    const [selectedScope, selectedPath] = selectedCollection.split(":")
    if (scope !== selectedScope) {
      setSelectedItems([])
      return
    }
    setSelectedItems(selectedPath)
  }, [selectedCollection])

  const collectionInfo = {
    name: "",
    path: "/",
    user: user,
    scope: scope
  }

  const treeContextItems = [
    {
      label: "Create",
      fn: () => handleContextMenuSelection("create", collectionInfo)
    }
  ]

  const handleNodeSelect = (event, nodeId) => {
    let iconClicked = event.target.closest(".MuiTreeItem-iconContainer")
    if(iconClicked) return

    let result = []
    let parents = []
    findNodeByPath(collectionData, result, nodeId, parents)
    result = result[0]
    setSelectedCollection(`${scope}:${result.path}`)
    setSelectedItems(nodeId)
  }

  const handleNodeToggle = (event, nodeIds) => {
    let iconClicked = event.target.closest(".MuiTreeItem-iconContainer")
    if (iconClicked || nodeIds.length > expandedItems.length) {
      setExpandedItems(nodeIds)
    }
  }

  const handleContextMenuSelection = (action, collectionInfo) => {
    collectionInfo[`${action}Open`] = true
    setModalData(collectionInfo)
  }

  const handleReOrder = (source, target, offset) => {
    const data = {
      source: source,
      target: target,
      offset: offset,
      scope: scope,
      user: user
    }
    serverRequest("reorder_collection", {data: data}).then(resp => {
      if (resp.ok) enqueueSnackbar("Success!", {variant: "success"})
      else enqueueSnackbar("Error reordering collection.", {variant: "error"})
      onRefresh()
    })
  }

  const renderTree = (nodes) => {
    const filter_string = nodes.filter_strings.join(" ")
    const hide = filterValue && !filter_string.includes(filterValue)
    return (
      <StyledTreeItem
        key={nodes.path}
        nodeId={nodes.path}
        name={nodes.name}
        labelIcon={ICONS[nodes.icon]}
        labelInfo={nodes.dir_kind}
        dynamic={nodes.dynamic || true}
        path={nodes.path}
        expression={nodes.expression}
        onContextOpen={handleContextMenuSelection}
        style={hide ? {display: "none"} : null}
        onFocusCapture={e => e.stopPropagation()}
        custom={{setdroppreviewdata: setDropPreviewData, onreorder: handleReOrder}}
        user={user}
        scope={scope}
      >
        {Array.isArray(nodes.children)
          ? nodes.children.map((node) => renderTree(node))
          : null}
      </StyledTreeItem>
    )
  }

  const dropPreviewStyle = {
    opacity: dropPreviewData.opacity,
    top: dropPreviewData.top,
    left: dropPreviewData.left,
    height: dropPreviewData.height,
    width: dropPreviewData.width
  }

  return (
    <div className={styles.container} onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}>
      <div className={styles.dropPreview} style={dropPreviewStyle} />
      <ContextMenu items={treeContextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <EditColl open={modalData.editOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, editOpen: false}))}
        data={modalData} fn={onRefresh}
      />
      <CreateColl open={modalData.createOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, createOpen: false}))}
        data={modalData} fn={onRefresh}
      />
      <DeleteColl open={modalData.deleteOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, deleteOpen: false}))}
        data={modalData} fn={onRefresh}
      />
      <RenameColl open={modalData.renameOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, renameOpen: false}))}
        data={modalData} fn={onRefresh}
      />
      <div className={styles.filterBar}>
        <OutlinedInput
          id="outlined-basic"
          size="small"
          fullWidth
          placeholder="Filter"
          value={filterValue}
          onChange={e => setFilterValue(e.target.value.toLowerCase() || "")}
        />
      </div>
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
          {collectionData.map((node) => renderTree(node))}
        </TreeView>
      </div>
    </div>
  )
}

export default CollectionTree
