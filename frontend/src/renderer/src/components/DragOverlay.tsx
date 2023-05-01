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

import { Variant } from "@mui/material/styles/createTypography";
import Typography from "@mui/material/Typography";

import styles from "./DragOverlay.module.css";

interface DragOverlayProps {
  text: string;
  error?: string;
  variant?: Variant;
  style?: React.CSSProperties;
}

const DragOverlay = ({ text, error, variant = "h3", style = {} }: DragOverlayProps) => {
  const containerStyle = error
    ? {
        backgroundColor: "rgba(255, 0, 0, 0.3)",
        borderColor: "rgb(200, 0, 0)",
        cursor: "no-drop",
      }
    : {};

  return (
    <div className={styles.container} style={{ ...containerStyle, ...style }}>
      <Typography className={styles.text} variant={variant}>
        {error || text}
      </Typography>
    </div>
  );
};

export default DragOverlay;
