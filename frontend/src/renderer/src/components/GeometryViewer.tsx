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

import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Asset } from "@renderer/types/common";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";

// import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

const GLTF_PLACEHOLDER = "/asset_library/3d/asset_library/common/model_placeholder.gltf";

interface ModelProps {
  asset: IgniteAsset;
}

const Model = (props: ModelProps) => {
  const [path, setPath] = useState(GLTF_PLACEHOLDER);

  useEffect(() => {
    let gltf_path = props.asset.asset_dir + "/3dpreview/model.gltf";
    window.api.checkPath(gltf_path).then((exists: boolean) => {
      if (!exists) gltf_path = GLTF_PLACEHOLDER;
      setPath(gltf_path);
    });
  }, [props.asset]);

  let gltf = useGLTF(
    `http://192.168.11.44:8084/files/${path.replace("/asset_library/3d/asset_library/", "")}`
  );
  console.log(path);
  // gltf.scene.children[0].material = <meshStandardMaterial attach="material" color="lightblue" />;
  const mat = new THREE.MeshStandardMaterial({ color: "red" });
  for (const [, mesh] of Object.entries(gltf.nodes)) {
    mesh.material = mat;
  }
  // const diffuseColor = new THREE.Color().setHSL( 1, 0.5, 0.25 );
  // const material = new THREE.MeshPhysicalMaterial( {
  //   color: diffuseColor,
  //   metalness: 0,
  //   roughness: 0.2,
  //   clearcoat: 0,
  //   clearcoatRoughness: 0,
  //   reflectivity: 1.0,
  //   // envMap: ( index % 2 ) == 1 ? texture : null
  // } );

  // const shd = <meshStandardMaterial attach="material" color={0x0ff000} />;
  console.log(gltf);
  return (
    <>
      {/* <meshStandardMaterial attach="material" color="red" /> */}
      <primitive object={gltf.scene} scale={10} />
      {/* <mesh geometry={gltf.nodes.geo1.geometry}>
      <meshStandardMaterial color="lightblue" />
      </mesh> */}
    </>
  );
};

const mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.PAN,
};

interface ModelViewerProps {
  asset: IgniteAsset;
}

const ModelViewer = ({ asset }: ModelViewerProps) => {
  return (
    <Canvas camera={{ zoom: 1, position: [0, 0, 1] }}>
      <OrbitControls
        enableRotate={true}
        enableDamping={false}
        zoomSpeed={3}
        mouseButtons={mouseButtons}
      />
      <Suspense fallback={null}>
        {/* <ambientLight intensity={50} /> */}
        <Environment preset="studio" />
        {/* <pointLight position={[10, 10, 10]} /> */}
        <mesh>
          <Model asset={asset} />
          {/* <meshStandardMaterial map={colorMap} /> */}
        </mesh>
      </Suspense>
    </Canvas>
    // <Canvas shadows>
    //   {/* <color attach="background" args={['#101010']} />
    //   <fog attach="fog" args={['#101010', 10, 20]} /> */}
    //   <Suspense fallback={<boxGeometry args={[10, 10, 10]} />}>
    //     {/* <fog attach="fog" args={['#101010', 0, 10]} /> */}
    //     <Environment preset="studio" background/>
    //     <Model asset={asset} />
    //     <OrbitControls
    //       makeDefault
    //       autoRotate
    //       autoRotateSpeed={1}
    //       // maxPolarAngle={Math.PI / 2.3}
    //       // minPolarAngle={Math.PI / 2.3}
    //       // enableZoom={false}
    //       enablePan={false}
    //     />
    //     <PerspectiveCamera makeDefault fov={65} position={[0, 0, 4]}>
    //       <spotLight position={[10, 10, 5]} angle={0.15} penumbra={1} intensity={10} castShadow shadow-mapSize={[2048, 2048]} />
    //     </PerspectiveCamera>
    //   </Suspense>
    // </Canvas>
  );
};

export default ModelViewer;

// useGLTF.preload('/users/george/tmp/gltf/test.gltf')
