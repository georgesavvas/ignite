/* eslint-disable react/no-unknown-property */
import React, {useState, Suspense, useEffect} from "react";

import * as THREE from "three";
import {Canvas} from "@react-three/fiber";
// import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {useGLTF, OrbitControls, Environment} from "@react-three/drei";


const GLTF_PLACEHOLDER = "/asset_library/3d/asset_library/common/model_placeholder.gltf";

function Model(props) {
  const [path, setPath] = useState(GLTF_PLACEHOLDER);

  useEffect(() => {
    let gltf_path = props.asset.asset_dir + "/3dpreview/model.gltf";
    window.api.checkPath(gltf_path).then(exists => {
      if (!exists) gltf_path = GLTF_PLACEHOLDER;
      setPath(gltf_path);
    });
  }, [props.asset]);

  let gltf = useGLTF(`http://192.168.11.44:8084/files/${path.replace("/asset_library/3d/asset_library/", "")}`);
  console.log(path);
  // gltf.scene.children[0].material = <meshStandardMaterial attach="material" color="lightblue" />;
  const mat = new THREE.MeshStandardMaterial({color: "red"});
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
}

const mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.PAN
};

function ModelViewer({asset }) {
  return (
    <Canvas camera={{zoom: 1, position: [0, 0, 1] }}>
      <OrbitControls enableRotate={true} enableDamping={false} zoomSpeed={3} mouseButtons={mouseButtons} />
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
}

export default ModelViewer;

// useGLTF.preload('/users/george/tmp/gltf/test.gltf')
