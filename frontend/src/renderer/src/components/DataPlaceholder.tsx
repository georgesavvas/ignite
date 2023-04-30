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

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  height: "100%",
  flexGrow: "100",
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  boxSizing: "border-box",
  pointerEvents: "none",
  userSelect: "none",
};

const typeStyle = {
  color: "rgb(70, 70, 70)",
};

interface DataPlaceholderProps {
  text?: string;
  style?: React.CSSProperties;
  variant?: Variant;
}

const DataPlaceholder = ({ text, variant = "h4", style = {} }: DataPlaceholderProps) => {
  return (
    <div style={{ ...containerStyle, ...style }}>
      <Typography variant={variant} style={typeStyle}>
        {text || "Fetching data..."}
      </Typography>
    </div>
  );
};

export default DataPlaceholder;
