import { grid } from "@mui/system";
import React, { Suspense, useEffect, useContext, useState } from "react";
import Slider from '@mui/material/Slider';
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls   } from "@react-three/drei";
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { Typography } from "@mui/material";
import {ConfigContext} from "../../contexts/ConfigContext";
import BuildFileURL from "../../services/BuildFileURL";
import { clamp } from "../../utils/math";
// import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const style = {
  // border: "solid red 1px",
  // aspectRatio: 16 / 9,
  backgroundColor: "rgb(30,30,30)",
  position: "relative",
  height: "100%",
  width: "100%",
  boxSizing: "border-box",
  display: grid,
}

// function ImgViewer(props) {
//   return (
//     <TransformWrapper limitToBounds={false}>
//       <TransformComponent>
//         <img src={props.path} />
//       </TransformComponent>
//     </TransformWrapper>
//   )
// }

const sliderContainerStyle = {
  position: "absolute",
  left: "30px",
  right: "30px",
  bottom: "30px",
  zIndex: 1
}

function Scene({path}) {
  path = path || "media/no_icon.png";
  const loader = path.includes(".exr") ? EXRLoader : TextureLoader
  const colorMap = useLoader(loader, path);
  return(
    <mesh>
      <planeGeometry attach="geometry" args={[1.77, 1]} />
      <meshStandardMaterial map={colorMap} />
    </mesh>
  )
}

function EXRViewer(props) {
  const [progress, setProgress] = useState(0.5);
  const comp = props.comp;

  const handleFrameChange = value => {
    const new_progress = (value - comp.first_frame) / (comp.last_frame - comp.first_frame);
    setProgress(new_progress);
  }

  let path = "media/no_icon.png";
  if (comp.path) path = BuildFileURL(comp.path, props.config, {forceRemote: true});
  if (!comp.static) {
    let frame = comp.first_frame + (comp.last_frame - comp.first_frame) * progress;
    frame = Math.round(frame);
    frame = clamp(frame, comp.first_frame, comp.last_frame);
    path = path.replace("####", frame);
  }
  
  const mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.PAN
  }

  return (
    <div style={{position: "relative", height: "100%", width: "100%"}}>
      <div style={sliderContainerStyle}>
        <Slider
          defaultValue={comp.first}
          valueLabelDisplay="auto"
          track={false}
          step={1}
          onChange={(e, value) => handleFrameChange(value)}
          marks
          min={comp.first_frame}
          max={comp.last_frame}
        />
      </div>
      <Canvas orthographic camera={{ zoom: 100, position: [0, 0, 1] }}>
        <OrbitControls enableRotate={false} enableDamping={false} zoomSpeed={3} mouseButtons=
        {mouseButtons} />
        <ambientLight intensity={0.75} />
        <Suspense fallback={null}>
          <Scene path={path} />
        </Suspense>
      </Canvas>
    </div>
  )
}

function VideoViewer(props) {
  console.log(props)
  return (
    // <TransformWrapper limitToBounds={false}>
    //   <TransformComponent>
        <video width="100%" height="100%" controls>
          <source src={props.path} type="video/mp4" />
        </video>
    //   </TransformComponent>
    // </TransformWrapper>
  )
}

function GeoViewer(props) {
  const loader = props.comp.ext === ".exr" ? EXRLoader : TextureLoader;
  const colorMap = useLoader(loader, props.path)
  return (
    <Canvas orthographic camera={{ zoom: 100, position: [0, 0, 1] }}>
      <OrbitControls enableRotate={false} />
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <mesh>
          <planeGeometry />
          <meshStandardMaterial map={colorMap} />
        </mesh>
      </Suspense>
    </Canvas>
  )
}

function ComponentViewer(props) {
  const [config, setConfig] = useContext(ConfigContext);
  const [progress, setProgress] = useState(0.5);
  
  const comp = props.comp;
  let path = "media/no_icon.png";
  if (comp.path_nr) path = BuildFileURL(comp.path_nr, config, {forceRemote: true});
  if (!comp.static) {
    let frame = comp.first_frame + (comp.last_frame - comp.first_frame) * progress;
    frame = Math.round(frame);
    path = path.replace("####", frame);
  }

  const handleFrameChange = value => {
    const new_progress = (value - comp.first_frame) / (comp.last_frame - comp.first_frame);
    setProgress(new_progress);
  }

  const getViewer = (comp, path) => {
    const ext = comp.ext;
    const img = [".jpg", ".jpeg", ".png", ".tif", ".tiff"];
    const exr = [".exr"];
    const vid = [".mp4", ".mov"];
    const geo = [];
    if (img.includes(ext)) return <EXRViewer comp={comp} path={path} config={config} />;
    else if (exr.includes(ext)) return <EXRViewer comp={comp} path={path} config={config} />;
    else if (vid.includes(ext)) return <VideoViewer comp={comp} path={path} />;
    else if (geo.includes(ext)) return <GeoViewer comp={comp} path={path} />;
    else return <Typography>No file preview for {comp.filename}</Typography>;
  }

  return (
    <div style={style}>
      {getViewer(props.comp, path)}
    </div>
  )
}

export default ComponentViewer;
