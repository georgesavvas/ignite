// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/* eslint-disable react/no-unknown-property */
import React, {Suspense, useContext, useState} from "react";

import {grid} from "@mui/system";
import Slider from "@mui/material/Slider";
import * as THREE from "three";
import {Canvas, useLoader, useThree} from "@react-three/fiber";
import {OrbitControls, Center } from "@react-three/drei";
import {TextureLoader} from "three/src/loaders/TextureLoader";
import {EXRLoader} from "three/examples/jsm/loaders/EXRLoader.js";
import {Typography} from "@mui/material";

import {ConfigContext} from "../../contexts/ConfigContext";
import BuildFileURL from "../../services/BuildFileURL";
import { clamp } from "../../utils/math";
import DataPlaceholder from "../../components/DataPlaceholder";
// import {USDZLoader} from "../../utils/threejsDev/USDLoader";


const style = {
  // border: "solid red 1px",
  // aspectRatio: 16 / 9,
  backgroundColor: "rgb(30,30,30)",
  position: "relative",
  height: "100%",
  width: "100%",
  boxSizing: "border-box",
  display: grid,
};

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
};

function Scene({path}) {
  path = path || "media/no_icon.png";
  const isExr = path.includes(".exr");
  const loader = isExr ? EXRLoader : TextureLoader;
  const colorMap = useLoader(loader, path);
  const viewport = useThree((state) => state.viewport);

  if (!isExr) {
    colorMap.encoding = THREE.sRGBEncoding;
  }

  const width = colorMap.source.data.width;
  const height = colorMap.source.data.height;
  const ratio = width / height;

  return(
    <Center onCentered={({container, width, height}) => container.scale.setScalar(Math.min(viewport.width / width, viewport.height / height))}>
      <mesh>
        <planeGeometry attach="geometry" args={[ratio, 1]} />
        <meshBasicMaterial map={colorMap} />
      </mesh>
    </Center>
  );
}

function EXRViewer(props) {
  const [progress, setProgress] = useState(0.5);
  const comp = props.comp;

  const handleFrameChange = value => {
    const new_progress = (value - comp.first_frame) / (comp.last_frame - comp.first_frame);
    setProgress(new_progress);
  };

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
  };

  return (
    <div style={{position: "relative", height: "100%", width: "100%"}}>
      <div style={{...sliderContainerStyle, display: comp.static ? "none" : "inherit"}}>
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
      <Canvas orthographic camera={{ zoom: 350, position: [0, 0, 1] }}>
        <OrbitControls enableRotate={false} enableDamping={false} zoomSpeed={3} mouseButtons=
          {mouseButtons} />
        {/* <ambientLight intensity={0.75} /> */}
        <Suspense fallback={null}>
          <Scene path={path} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// function UsdScene({path}) {
//   const usd = useLoader(USDZLoader, path);
//   console.log(usd);
//   // extend(usd)
//   return(
//     <mesh>
//       {/* <usd /> */}
//       {/* {[usd]} */}
//       {/* <primitive object={usd.parent.parent} /> */}
//       {/* <planeGeometry args={[1, 1]} /> */}
//       {/* <planeGeometry attach="geometry" args={[ratio, 1]} />
//       <meshBasicMaterial map={colorMap} /> */}
//     </mesh>
//   );
// }

// function UsdViewer(props) {
//   const comp = props.comp;

//   let path = "";
//   if (comp.path) path = BuildFileURL(comp.path, props.config, {forceRemote: true});
//   path = "test.usdz";
  
//   return (
//     <div style={{position: "relative", height: "100%", width: "100%"}}>
//       <Canvas camera={{ zoom: 100, position: [0, 0, 1] }}>
//         <OrbitControls />
//         <ambientLight intensity={0.75} />
//         <Suspense fallback={null}>
//           <UsdScene path={path} />
//         </Suspense>
//       </Canvas>
//     </div>
//   );
// }

function VideoViewer(props) {
  return (
    <video key={Math.random()} width="100%" height="100%" style={{overflow: "hidden"}} loop controls>
      <source src={props.path} type="video/mp4" />
    </video>
  );
}

function GeoViewer(props) {
  const loader = props.comp.ext === ".exr" ? EXRLoader : TextureLoader;
  const colorMap = useLoader(loader, props.path);
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
  );
}

function ComponentViewer(props) {
  const [config] = useContext(ConfigContext);
  
  const comp = props.comp;

  if (!comp) return (
    <DataPlaceholder text="No component selected" />
  );

  let path = "media/no_icon.png";
  if (comp.path_nr) path = BuildFileURL(comp.path_nr, config, {forceRemote: true});
  if (!comp.static) {
    let frame = comp.first_frame + (comp.last_frame - comp.first_frame) * 0.5;
    frame = Math.round(frame);
    path = path.replace("####", frame);
  }

  const getViewer = (comp, path) => {
    const ext = comp.ext;
    const img = [".jpg", ".jpeg", ".png", ".tif", ".tiff"];
    const exr = [".exr"];
    const vid = [".mp4", ".mov"];
    const geo = [];
    // const usd = [".usd", ".usdc", ".usda", ".usdz"];
    if (img.includes(ext)) return <EXRViewer comp={comp} path={path} config={config} />;
    else if (exr.includes(ext)) return <EXRViewer comp={comp} path={path} config={config} />;
    else if (vid.includes(ext)) return <VideoViewer comp={comp} path={path} />;
    else if (geo.includes(ext)) return <GeoViewer comp={comp} path={path} />;
    // else if (usd.includes(ext)) return <UsdViewer comp={comp} config={config} />;
    else return <Typography>No file preview for {comp.filename}</Typography>;
  };

  return (
    <div style={style}>
      {getViewer(props.comp, path)}
    </div>
  );
}

export default ComponentViewer;
