// Copyright 2022 Georgios Savvas

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

import styles from "./FilterBar.module.css";
import FilterBuilder from "./FilterBuilder";


const openStyle = {
  minHeight: "fit-content",
  maxHeight: "500px"
};

const closedStyle = {
  minHeight: 0,
  maxHeight: 0
};

const defaultExpr = "{ \"condition\": \"and\", \"filters\": [{ \"\": \"\" }, { \"\": \"\" }]}";

export default function FilterBar(props) {
  return (
    <div
      className={styles.filterBar}
      style={props.open ? openStyle : closedStyle}
    >
      <FilterBuilder
        default={defaultExpr}
        onChange={value => props.onFilterChange({"search": value})}
      />
    </div>
  );
}
