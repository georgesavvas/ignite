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

import { IgniteAssetVersion, IgniteScene } from "@renderer/types/common";
import { useContext } from "react";

import DataPlaceholder from "../../components/DataPlaceholder";
import { EntityContext, EntityContextType } from "../../contexts/EntityContext";
import AssetDetails from "./AssetDetails";
import DirectoryDetails from "./DirectoryDetails";
import SceneDetails from "./SceneDetails";

const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
} as React.CSSProperties;

const Details = () => {
  const { selectedEntity } = useContext(EntityContext) as EntityContextType;

  const render = () => {
    switch (selectedEntity.dir_kind) {
      case "assetversion":
        return <AssetDetails entity={selectedEntity as IgniteAssetVersion} />;
      case "scene":
        return <SceneDetails entity={selectedEntity as IgniteScene} />;
      case undefined:
        return <DataPlaceholder text="Nothing selected" />;
      default:
        return <DirectoryDetails entity={selectedEntity} />;
    }
  };

  return <div style={style}>{render()}</div>;
};

export default Details;
