import './App.css';
import 'react-reflex/styles.css'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import darkScrollbar from '@mui/material/darkScrollbar';
import GlobalStyles from '@mui/material/GlobalStyles';
import Home from './views/Home';
// import Splash from "./views/Splash";
import {ContextProvider} from "./contexts/ContextContext";
import {ConfigProvider} from "./contexts/ConfigContext";
import {EntityProvider} from "./contexts/EntityContext";
import { SnackbarProvider } from 'notistack';
import BuildFileURL from './services/BuildFileURL';
import {ErrorBoundary} from 'react-error-boundary'
import { Button, Typography } from "@mui/material";

let darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ignite: {
      main: "rgb(252, 140, 3)",
    },
    lightgrey: {
      main: "rgb(211,211,211)",
    },
  },
  typography: {
    // htmlFontSize: 18,
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
  )
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles styles={{ ...darkScrollbar() }} />
      <div className="App">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ConfigProvider>
            <ContextProvider>
              <EntityProvider>
                <SnackbarProvider maxSnack={3} autoHideDuration={2500}>
                  <Home />
                </SnackbarProvider>
              </EntityProvider>
            </ContextProvider>
          </ConfigProvider>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}

export default App;
