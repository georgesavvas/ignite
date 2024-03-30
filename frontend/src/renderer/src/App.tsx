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

import "react-reflex/styles.css";

import "./App.css";

import darkScrollbar from "@mui/material/darkScrollbar";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { SnackbarProvider } from "notistack";
import { ErrorBoundary } from "react-error-boundary";

import IgnButton from "./components/IgnButton";
import { ConfigProvider } from "./contexts/ConfigContext";
import { ContextProvider } from "./contexts/ContextContext";
import { CrateProvider } from "./contexts/CrateContext";
import { EntityProvider } from "./contexts/EntityContext";
import { VaultProvider } from "./contexts/VaultContext";
import { igniteTheme } from "./theme";
import { ClickEvent } from "./types/common";
import Home from "./views/Home";

// import BuildFileURL from "./services/BuildFileURL";

// BuildFileURL("");

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: (e: ClickEvent) => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <div className="errorFallback" role="alert">
      {/* <ErrorIcon /> */}
      <Typography variant="h4">{"Ignite has crashed :("}</Typography>
      <IgnButton size="large" onClick={resetErrorBoundary}>
        Reload
      </IgnButton>
      <pre className="errorContainer">{error.message}</pre>
    </div>
  );
};

const App = (): JSX.Element => {
  return (
    <ThemeProvider theme={igniteTheme}>
      <GlobalStyles styles={{ ...darkScrollbar() }} />
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
};

export default App;
