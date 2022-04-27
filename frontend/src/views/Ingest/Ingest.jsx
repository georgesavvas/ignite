import styles from "./Ingest.module.css";
import Files from "./Files";
import Rules from "./Rules";
import Output from "./Output";
import Divider from '@mui/material/Divider';
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import { useEffect, useState } from 'react';

const splitterStyle = {
  borderStyle: "solid",
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)",
  boxSizing: "border-box"
}

const defaultFlexRations = {
  "ingest.files": 0.3,
  "ingest.rules": 0.4,
  "ingest.output": 0.3
}

const duplicate = (x, n) => Array.from(new Array(n), () => x);

function Ingest() {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const files = data["ingest.files"];
    const rules = data["ingest.rules"];
    const output = data["ingest.output"];
    if (!files || !rules || !output) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const fullWidth = files[0] + rules[0] + output[0];
    const ratios = {
      "ingest.files": files[0] / fullWidth,
      "ingest.rules": rules[0] / fullWidth,
      "ingest.output": output[0] / fullWidth
    };
    setFlexRatios(ratios);
  }, [])

  const handleResized = data => {
    saveReflexLayout(data)
  }

  const files = [
    'textures/weathered_brown_planks_disp_2k.exr',
    'textures/weathered_brown_planks_diff_2k.exr',
    'textures/weathered_brown_planks_nor_gl_2k.exr',
    'textures/weathered_brown_planks_rough_2k.exr',
    'textures-2/coast_sand_01_nor_gl_2k.exr',
    'textures-2/coast_sand_01_rough_2k.exr',
    'textures-2/coast_sand_01_diff_2k.exr',
    'textures-2/coast_sand_01_disp_2k.exr',
    'textures-3/red_bricks_04_rough_2k.exr',
    'textures-3/red_bricks_04_disp_2k.exr',
    'textures-3/red_bricks_04_diff_2k.exr',
    'textures-3/red_bricks_04_nor_gl_2k.exr',
    'textures-4/forest_leaves_04_disp_2k.exr',
    'textures-4/forest_leaves_04_diff_2k.exr',
    'textures-4/forest_leaves_04_nor_gl_2k.exr',
    'textures-4/forest_leaves_04_rough_2k.exr',
    'textures-5/asphalt_02_nor_gl_2k.exr',
    'textures-5/asphalt_02_rough_2k.exr',
    'textures-5/asphalt_02_diff_2k.exr',
    'textures-5/asphalt_02_disp_2k.exr',
    'hdri/je_gray_park_2k.exr',
    'hdri/moonless_golf_2k.exr',
    'hdri/studio_small_09_2k.exr',
    'hdri/cannon_2k.exr',
    'hdri/reinforced_concrete_01_2k.hdr',
    'hdri/abandoned_parking_2k.exr',
    'hdri/quarry_04_2k.exr'
  ]

  const rules = [
    {
      "file_target": "*",
      "file_target_type": "directory",
      "rule_type": "extract_info",
      "rule_target": "filename",
      "rule_value": "{name.0}_{name.1}_{name.2}_{comp.0}_{}.{ext}"
    },
    {
      "file_target": "asphalt",
      "file_target_type": "filename",
      "rule_type": "extract_info",
      "rule_target": "filename",
      "rule_value": "{name.0}_{name.1}_{comp}_{}.{ext}"
    },
    {
      "file_target": "hdri",
      "file_target_type": "filepath",
      "rule_type": "extract_info",
      "rule_target": "filename",
      "rule_value": "{name.0}_{name.1}_{}.{ext}"
    },
    {
      "file_target": "*",
      "file_target_type": "filename",
      "rule_type": "replace_value",
      "rule_target": "nor",
      "rule_value": "norm"
    }
  ]

  const output = [{'comps': [{'file': 'weathered_brown_planks_disp_2k.exr', 'name': 'disp'},
  {'file': 'weathered_brown_planks_diff_2k.exr', 'name': 'diff'},
  {'file': 'weathered_brown_planks_nor_gl_2k.exr', 'name': 'norm'},
  {'file': 'weathered_brown_planks_rough_2k.exr', 'name': 'rough'}],
'name': 'weathered_brown_planks'},
{'comps': [{'file': 'coast_sand_01_nor_gl_2k.exr', 'name': 'norm'},
  {'file': 'coast_sand_01_rough_2k.exr', 'name': 'rough'},
  {'file': 'coast_sand_01_diff_2k.exr', 'name': 'diff'},
  {'file': 'coast_sand_01_disp_2k.exr', 'name': 'disp'}],
'name': 'coast_sand_01'},
{'comps': [{'file': 'red_bricks_04_rough_2k.exr', 'name': 'rough'},
  {'file': 'red_bricks_04_disp_2k.exr', 'name': 'disp'},
  {'file': 'red_bricks_04_diff_2k.exr', 'name': 'diff'},
  {'file': 'red_bricks_04_nor_gl_2k.exr', 'name': 'norm'}],
'name': 'red_bricks_04'},
{'comps': [{'file': 'forest_leaves_04_disp_2k.exr', 'name': 'disp'},
  {'file': 'forest_leaves_04_diff_2k.exr', 'name': 'diff'},
  {'file': 'forest_leaves_04_nor_gl_2k.exr', 'name': 'norm'},
  {'file': 'forest_leaves_04_rough_2k.exr', 'name': 'rough'}],
'name': 'forest_leaves_04'},
{'comps': [{'file': 'asphalt_02_nor_gl_2k.exr', 'name': 'norm'},
  {'file': 'asphalt_02_rough_2k.exr', 'name': 'rough'},
  {'file': 'asphalt_02_diff_2k.exr', 'name': 'diff'},
  {'file': 'asphalt_02_disp_2k.exr', 'name': 'disp'}],
'name': 'asphalt_02'},
{'comps': [{'file': 'je_gray_park_2k.exr', 'name': ''}], 'name': 'je_gray'},
{'comps': [{'file': 'moonless_golf_2k.exr', 'name': ''}],
'name': 'moonless_golf'},
{'comps': [{'file': 'studio_small_09_2k.exr', 'name': ''}],
'name': 'studio_small'},
{'comps': [{'file': 'reinforced_concrete_01_2k.hdr', 'name': ''}],
'name': 'reinforced_concrete'},
{'comps': [{'file': 'abandoned_parking_2k.exr', 'name': ''}],
'name': 'abandoned_parking'},
{'comps': [{'file': 'quarry_04_2k.exr', 'name': ''}], 'name': 'quarry_04'}]

  return (
    <div className={styles.container}>
      <ReflexContainer orientation="vertical">
        <ReflexElement flex={flexRatios["ingest.files"]} name="ingest.files" onStopResize={handleResized}>
          <Files data={files} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={flexRatios["ingest.rules"]} name="ingest.rules" onStopResize={handleResized}>
          <Rules data={rules} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={flexRatios["ingest.output"]} name="ingest.output" onStopResize={handleResized}>
          <Output data={output} />
        </ReflexElement>
      </ReflexContainer>
    </div>
  );
}

export default Ingest;
