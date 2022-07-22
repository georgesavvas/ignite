import './App.css';
import 'react-reflex/styles.css'
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import darkScrollbar from '@mui/material/darkScrollbar';
import GlobalStyles from '@mui/material/GlobalStyles';
import Home from './views/Home';
import {ContextProvider} from "./contexts/ContextContext";
import {ConfigProvider} from "./contexts/ConfigContext";
import {EntityProvider} from "./contexts/EntityContext";
import { SnackbarProvider } from 'notistack';
import BuildFileURL from './services/BuildFileURL';

const darkTheme = createTheme({
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
    allVariants: {
      color: "lightgrey"
    }
  },
});

BuildFileURL("");

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles styles={{ ...darkScrollbar() }} />
      <div className="App">
        <ConfigProvider>
          <ContextProvider>
            <EntityProvider>
              <SnackbarProvider maxSnack={3} autoHideDuration={2500}>
                <Home />
              </SnackbarProvider>
            </EntityProvider>
          </ContextProvider>
        </ConfigProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
