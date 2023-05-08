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

import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useXarrow } from "react-xarrows";

import DynamicList from "../../components/DynamicList";
import styles from "./Output.module.css";

type NewAssetType = {
  name: string;
  valid: boolean;
  task: string;
  comps: {
    name: string;
    source: string;
    trimmed: string;
  }[];
};

interface AssetProps {
  data: NewAssetType;
  id: string;
}

const Asset = ({ data, id }: AssetProps) => {
  return (
    <div className={`${styles.assetContainer} ${data.valid ? "" : styles.invalid}`}>
      <Typography variant="h6">{data.name}</Typography>
      <Typography variant="caption">Ingest in Task: {data.task}</Typography>
      <Divider textAlign="left" sx={{ margin: "5px 0 5px 0" }}>
        Components
      </Divider>
      {data.comps.map((comp, index) => (
        <div className={styles.compContainer} key={index}>
          <Typography variant="caption">{comp.name || "[No component name]"}</Typography>
          <Typography variant="caption" style={{ color: "rgb(150, 150, 150)" }}>
            ({comp.trimmed})
          </Typography>
        </div>
      ))}
      <div className={styles.connector} id={id} />
    </div>
  );
};

interface OutputProps {
  assets: NewAssetType[];
}

const Output = (props: OutputProps) => {
  const updateXarrow = useXarrow();

  return (
    <div className={styles.container}>
      <Typography variant="h6">Output Preview</Typography>
      <DynamicList noButtons onScroll={updateXarrow} style={{ marginTop: "34px" }}>
        {props.assets
          ? props.assets.map((child, index) => (
              <Asset data={child} key={index} id={"asset-" + index} />
            ))
          : undefined}
      </DynamicList>
    </div>
  );
};

export default Output;
