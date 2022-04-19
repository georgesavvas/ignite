import { grid } from "@mui/system";
import React, { Suspense, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls   } from "@react-three/drei";
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

const style = {
  border: "solid red 1px",
  // aspectRatio: 16 / 9,
  position: "relative",
  height: "100%",
  width: "100%",
  boxSizing: "border-box",
  display: grid,
}

function Viewer(props) {
  const comp = props.comp;
  let path = "media/no_icon.png";
  if (comp.path) path = `http://127.0.0.1:9091/files/${comp.api_path}`;
  if (!comp.static) {
    let frame = comp.first + (comp.last - comp.first) * props.progress;
    frame = Math.round(frame);
    path = path.replace("####", frame);
  }
  const loader = comp.ext === ".exr" ? EXRLoader : TextureLoader;
  console.log(path);
  const colorMap = useLoader(loader, path)
  return (
    <>
      <ambientLight intensity={0.5} />
      <mesh>
        <planeGeometry />
        <meshStandardMaterial map={colorMap} />
      </mesh>
    </>
  )
}

function ImageViewer(props) {
  const [progress, setProgress] = useState(0.5);

  const thumbnailStyle = {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto"
  };
  // console.log(props.entity);
  return (
    <div style={style}>
      {/* <img src={path} style={thumbnailStyle} /> */}
      <Canvas orthographic camera={{ zoom: 100, position: [0, 0, 1] }}>
        <OrbitControls enableRotate={false} />
        <Suspense fallback={null}>
          <Viewer comp={props.comp} progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default ImageViewer;
