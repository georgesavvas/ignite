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
