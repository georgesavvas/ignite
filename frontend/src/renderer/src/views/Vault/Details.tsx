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


import React from "react";

import AssetDetails from "./AssetDetails";
import DataPlaceholder from "../../components/DataPlaceholder";


const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column"
};

function Details(props) {
  const entity = props.entity;

  return (
    <div style={style}>
      {
        entity && Object.keys(entity).length ?
          <AssetDetails {...props} /> :
          <DataPlaceholder text="Nothing selected" />
      }
    </div>
  );
}

export default Details;