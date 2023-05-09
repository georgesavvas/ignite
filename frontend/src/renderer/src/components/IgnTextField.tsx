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

import { styled } from "@mui/material/styles";
import TextField, { TextFieldProps } from "@mui/material/TextField";

const StyledTextField = styled(TextField)<TextFieldProps>(() => ({
  "& .MuiFormLabel-root:not(.Mui-focused, .MuiFormLabel-filled)": {
    transform: "translate(10px, 5px) scale(1)",
  },
}));

export const IgnTextField = (props: TextFieldProps) => {
  return (
    <StyledTextField
      size="small"
      // InputLabelProps={
      //   props.value
      //     ? {}
      //     : {
      //         style: {
      //           transform: "translate(10px, 5px) scale(1)",
      //         },
      //       }
      // }
      inputProps={{
        style: {
          padding: "5px 8px",
        },
      }}
      {...props}
    />
  );
};

export default IgnTextField;
