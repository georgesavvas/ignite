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

import Button from "@mui/material/Button";
import darkScrollbar from "@mui/material/darkScrollbar";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { SnackbarProvider } from "notistack";
import { ErrorBoundary } from "react-error-boundary";
import "react-reflex/styles.css";

import "./App.css";
import { ConfigProvider } from "./contexts/ConfigContext";
import { ContextProvider } from "./contexts/ContextContext";
import { CrateProvider } from "./contexts/CrateContext";
import { EntityProvider } from "./contexts/EntityContext";
import { VaultProvider } from "./contexts/VaultContext";
import BuildFileURL from "./services/BuildFileURL";
import Home from "./views/Home";


// declare module "@mui/material/styles" {
//   interface Palette {
//     ignite: Palette["primary"];
//   }

//   interface PaletteOptions {
//     ignite: PaletteOptions["primary"];
//   }

//   interface Palette {
//     lightgrey: Palette["primary"];
//   }

//   interface PaletteOptions {
//     lightgrey: PaletteOptions["primary"];
//   }
// };


const darkTheme = createTheme({
  palette: {
    mode: "dark",
    ignite: {
      main: "rgb(252, 140, 3)",
    },
    lightgrey: {
      main: "rgb(211,211,211)",
    },
  },
  typography: {
    fontSize: 12.5,
    allVariants: {
      color: "lightgrey"
    }
  },
});

BuildFileURL("");

const ErrorFallback = ({error, resetErrorBoundary}) => {
  return (
    <div className="errorFallback" role="alert">
      {/* <ErrorIcon /> */}
      <Typography variant="h4">{"Ignite has crashed :("}</Typography>
      <Button color="ignite" variant="outlined" size="large" onClick={resetErrorBoundary}>Reload</Button>
      <pre className="errorContainer">{error.message}</pre>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles styles={{...darkScrollbar()}} />
      <div className="App">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <SnackbarProvider maxSnack={3} autoHideDuration={2500}>
            <ConfigProvider>
              <ContextProvider>
                <CrateProvider>
                  <EntityProvider>
                    <VaultProvider>
                      <Home />
                    </VaultProvider>
                  </EntityProvider>
                </CrateProvider>
              </ContextProvider>
            </ConfigProvider>
          </SnackbarProvider>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}

export default App;
