import { grid } from "@mui/system";
import React, { Suspense, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three/src/loaders/TextureLoader'

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
  const colorMap = useLoader(TextureLoader, `ign://${props.texture}`)
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
  const path = `${props.entity.path || "C:\\Users\\George\\Desktop\\assetlib\\no_icon.png"}`;

  const thumbnailStyle = {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto"
  };
  console.log(props.entity);
  return (
    <div style={style}>
      {/* <img src={path} style={thumbnailStyle} /> */}
      <Canvas orthographic camera={{ zoom: 100, position: [0, 0, 1] }}>
        <Suspense fallback={null}>
          <Viewer texture={path} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default ImageViewer;
