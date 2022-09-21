import React, {useState, useEffect, createRef, useRef} from "react"
import styles from "./AssetTile.module.css"
import Typography from "@mui/material/Typography"
import { useSnackbar } from "notistack"
import openExplorer from "../../utils/openExplorer"
import { fit, clamp } from "../../utils/math"
import { CopyToClipboard } from "../ContextActions"
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu"

const noThumbnail = "/asset_library/3d/asset_library/common/icons/no_icon.png"

// const getPreviewComponent = comps => {
//   const previewComps = comps.filter(comp => {
//     return comp.file.endsWith(".mp4")
//   })
//   if (!previewComps[0]) return ""
//   return previewComps[0].file
// }

function AssetTile(props) {
  const media = props.asset.media
  const render = media.renders ? media.renders[0] : {}
  const still = render ? render.mapping === "nomapping" : true
  // const previewComp = getPreviewComponent(props.asset.components)
  let thumbnail = media.thumbnail || noThumbnail
  // if (previewComp) thumbnail = previewComp
  const videoTile = thumbnail.endsWith(".mp4")
  const [path, setPath] = useState(thumbnail)
  const [progress, setProgress] = useState(0.5)
  const videoRef = useRef()
  const [contextMenu, setContextMenu] = useState(null)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  useEffect(() => {
    setPath(thumbnail)
  }, [props.asset])

  useEffect(() => {
    if (!videoRef.current) return
    if (props.autoPlay) videoRef.current.play()
    else videoRef.current.pause()
  }, [props.autoPlay])

  const handleMouseMove = (e) => {
    if (still || videoTile) return
    const rect = hoverArea.current.getBoundingClientRect()
    const height = (e.clientY - rect.top) / rect.height
    const width = (e.clientX - rect.left) / rect.width
    setProgress(width)
    var frame = parseInt(1001 + height * 100)
    
    if (still) frame = render.first
    else if (render.mapping === "mapping") frame = parseInt(fit(width, 0.1, 0.9, render.first, render.fend))
    else if (render.mapping.startsWith("mapping_v")) {
      const sections = parseInt(render.mapping.slice(-1))
      const fend = render.first + render.frames / sections - 1
      frame = parseInt(fit(width, 0.1, 0.9, render.first, fend))
      if (height > 0.25) {
        if (height < 0.41) frame += 20
        else if (height < 0.59) frame += 40
        else if (height < 0.75) frame += 60
        else frame += 80
      }
    }
    frame = clamp(frame, render.first, render.last)
    setPath(render.path.replace("####", frame.toString()))
  }

  const handleClick = (e) => {
    // setSelected(1);
    props.onSelected(props.asset)
  }

  const hoverArea = createRef()

  const tileStyle = {
    borderStyle: "solid",
    borderWidth: "1.5px",
    borderColor: props.selected ? "rgb(79, 140, 180)" : "rgb(50, 50, 50)",
    borderRadius: "5px",
    width: "100%",
    height: "100%",
    // maxHeight: props.size / props.aspectRatio,
    // maxWidth: props.size,
    aspectRatio: props.aspectRatio,
    // transition: "width 2s height 2s aspect-ratio 2s transform 2s",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "clip",
    cursor: "pointer"
  }

  const aspR = props.aspectRatio

  const thumbnailStyle = {
    height: "100%",
    width: "100%",
    margin: "auto",
    top: 0,
    left: 0,
    position: "absolute",
    objectFit: "cover",
    overflow: "hidden"
  }

  const contextItems = [
    {
      "label": "Copy ID",
      "fn": () => CopyToClipboard(props.asset.id, enqueueSnackbar)
    },
    {
      "label": "Copy name",
      "fn": () => CopyToClipboard(props.asset.name, enqueueSnackbar)
    },
    {
      "label": "Copy path",
      "fn": () => CopyToClipboard(props.asset.components_dir, enqueueSnackbar),
      "divider": true
    },
    {
      "label": "Open in file explorer",
      "fn": () => openExplorer(props.asset.components_dir, enqueueSnackbar),
      "divider": true
    },
    {
      "label": "Edit asset",
      "fn": () => props.onAssetEdit(props.asset)
    },
    {
      "label": "Delete asset",
      "fn": () => props.onAssetDelete(props.asset)
    }
  ]

  return (
    <div
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className={styles.tile}
      style={tileStyle}
      onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
    >
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      {videoTile ?
        <video ref={videoRef} src={`alib://${thumbnail}`} loop style={thumbnailStyle} /> :
        <img src={`alib://${path}`} style={thumbnailStyle} />
      }
      <div className={styles.hoverArea} onMouseMove={handleMouseMove} ref={hoverArea}>
        <div className={styles.overlay}>
          {/* <div className={styles.topGrad} /> */}
          <div className={styles.bottomGrad} />
          {/* <Typography style={{"position": "absolute", "top": "5px", "left": "5px"}}>{props.asset.context}</Typography> */}
          <Typography variant="subtitle2" style={{"position": "absolute", "bottom": "5px", "left": "10px"}}>{props.asset.name}</Typography>
          {/* <Typography style={{"position": "absolute", "bottom": "5px", "right": "5px"}}>{props.asset.version}</Typography> */}
        </div>
        {/* <div className={styles.bar} style={still ? hidden : barStyle} /> */}
      </div>
    </div>
  )
}

export default AssetTile
