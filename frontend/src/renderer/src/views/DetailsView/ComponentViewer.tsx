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

/* eslint-disable react/no-unknown-property */

import { Typography } from "@mui/material";
import Slider from "@mui/material/Slider";
import { Center, OrbitControls } from "@react-three/drei";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { IgniteComponent } from "@renderer/types/common";
import React, { Suspense, useContext, useState } from "react";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { TextureLoader } from "three/src/loaders/TextureLoader";

import DataPlaceholder from "../../components/DataPlaceholder";
import { Config, ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import BuildFileURL from "../../services/BuildFileURL";
import { clamp } from "../../utils/math";

// import {USDZLoader} from "../../utils/threejsDev/USDLoader";

const style = {
  backgroundColor: "rgb(30,30,30)",
  position: "relative",
  height: "100%",
  width: "100%",
  boxSizing: "border-box",
  display: "grid",
} as React.CSSProperties;

// const ImgViewer = (props) => {
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
  zIndex: 1,
} as React.CSSProperties;

const Scene = ({ path }: { path: string }) => {
  path = path || "src/assets/no_icon.png";
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

  return (
    <Center
      onCentered={({ container, width, height }) =>
        container.scale.setScalar(Math.min(viewport.width / width, viewport.height / height))
      }
    >
      <mesh>
        <planeGeometry attach="geometry" args={[ratio, 1]} />
        <meshBasicMaterial map={colorMap} />
      </mesh>
    </Center>
  );
};

interface EXRViewerProps {
  comp: IgniteComponent;
  config: Config;
}

const EXRViewer = (props: EXRViewerProps) => {
  const [progress, setProgress] = useState(0.5);
  const comp = props.comp;

  const handleFrameChange = (value: number) => {
    const new_progress = (value - comp.first_frame) / (comp.last_frame - comp.first_frame);
    setProgress(new_progress);
  };

  let path = "src/assets/no_icon.png";
  if (comp.path) path = BuildFileURL(comp.path, props.config, { forceRemote: true });
  if (!comp.static) {
    const amount = comp.frames.length;
    const sectionSize = 1 / amount;
    const section = clamp(Math.floor(progress / sectionSize), 0, amount - 1);
    const frame = comp.frames[section];
    path = path.replace("####", frame);
  }

  const mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.PAN,
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div
        style={{
          ...sliderContainerStyle,
          display: comp.static ? "none" : "inherit",
        }}
      >
        {comp.frames.length > 0 ? (
          <Slider
            defaultValue={comp.first_frame}
            valueLabelDisplay="auto"
            track={false}
            step={1}
            onChange={(_, value) => handleFrameChange(value as number)}
            marks
            min={parseInt(comp.frames[0])}
            max={parseInt(comp.frames.at(-1) || "0")}
          />
        ) : null}
      </div>
      <Canvas orthographic camera={{ zoom: 350, position: [0, 0, 1] }}>
        <OrbitControls
          enableRotate={false}
          enableDamping={false}
          zoomSpeed={3}
          mouseButtons={mouseButtons}
        />
        {/* <ambientLight intensity={0.75} /> */}
        <Suspense fallback={null}>
          <Scene path={path} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// const UsdScene = ({path}) => {
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

// const UsdViewer = (props) => {
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

interface VideoViewerProps {
  path: string;
}

const VideoViewer = (props: VideoViewerProps) => {
  return (
    <video
      key={Math.random()}
      width="100%"
      height="100%"
      style={{ overflow: "hidden" }}
      loop
      controls
    >
      <source src={props.path} type="video/mp4" />
    </video>
  );
};

interface GeoViewerProps {
  path: string;
  comp: IgniteComponent;
}

const GeoViewer = (props: GeoViewerProps) => {
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
};

interface ComponentViewerProps {
  comp?: IgniteComponent;
}

const ComponentViewer = (props: ComponentViewerProps) => {
  const { config } = useContext(ConfigContext) as ConfigContextType;

  const comp = props.comp;
  if (!comp || !Object.keys(comp).length) return <DataPlaceholder text="No component selected" />;

  let path = "src/assets/no_icon.png";
  if (comp.path_nr) path = BuildFileURL(comp.path_nr, config, { forceRemote: true });
  if (!comp.static) {
    const amount = comp.frames.length;
    const frame = comp.frames[Math.round(amount / 2)];
    // let frame = comp.first_frame + (comp.last_frame - comp.first_frame) * 0.5;
    // frame = Math.round(frame);
    path = path.replace("####", frame);
  }

  const getViewer = (comp: IgniteComponent | undefined, path: string) => {
    if (!comp) return null;
    const ext = comp.ext;
    const img = [".jpg", ".jpeg", ".png", ".tif", ".tiff"];
    const exr = [".exr"];
    const vid = [".mp4", ".mov"];
    const geo = [] as string[];
    // const usd = [".usd", ".usdc", ".usda", ".usdz"];
    if (img.includes(ext)) return <EXRViewer comp={comp} config={config} />;
    else if (exr.includes(ext)) return <EXRViewer comp={comp} config={config} />;
    else if (vid.includes(ext)) return <VideoViewer path={path} />;
    else if (geo.includes(ext)) return <GeoViewer comp={comp} path={path} />;
    // else if (usd.includes(ext)) return <UsdViewer comp={comp} config={config} />;
    else
      return (
        <Typography style={{ textAlign: "center", margin: "auto" }}>
          No file preview for {comp.filename}
        </Typography>
      );
  };

  return <div style={style}>{getViewer(props.comp, path)}</div>;
};

export default ComponentViewer;
