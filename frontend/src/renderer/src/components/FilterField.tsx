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

import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";
import Typography from "@mui/material/Typography";

import styles from "./FilterField.module.css";

interface FilterFieldProps {
  filterValue: string;
  setFilterValue: () => void;
  children?: React.ReactNode | React.ReactNode[];
}

const FilterField = ({ filterValue, setFilterValue, children }: FilterFieldProps) => {
  return (
    <div className={styles.filterBar}>
      <FormControl fullWidth focused={filterValue ? true : false}>
        <OutlinedInput
          id="outlined-basic"
          size="small"
          fullWidth
          placeholder="Filter"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value || "")}
          color={filterValue ? "error" : ""}
        />
        {!filterValue ? null : (
          <Typography
            variant="subtitle1"
            align="center"
            className={styles.clearButton}
            onClick={() => setFilterValue("")}
          >
            Clear
          </Typography>
        )}
      </FormControl>
      {children}
    </div>
  );
};

export default FilterField;
