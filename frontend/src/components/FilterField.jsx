import React from "react";

import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";
import Typography from "@mui/material/Typography";

import styles from "./FilterField.module.css";


const FilterField = ({filterValue, setFilterValue, children}) => {
  return (
    <div className={styles.filterBar}>
      <FormControl fullWidth focused={filterValue ? true : false}>
        <OutlinedInput
          id="outlined-basic"
          size="small"
          fullWidth
          placeholder="Filter"
          value={filterValue}
          onChange={e => setFilterValue(e.target.value || "")}
          color={filterValue ? "error" : ""}
        />
        {!filterValue ? null :
          <Typography
            variant="subtitle1"
            align="center"
            className={styles.clearButton}
            onClick={() => setFilterValue("")}
          >
            Clear
          </Typography>
        }
      </FormControl>
      {children}
    </div>
  );
};

export default FilterField;
