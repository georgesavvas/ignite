import './App.css';
import 'react-reflex/styles.css'
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import darkScrollbar from '@mui/material/darkScrollbar';
import GlobalStyles from '@mui/material/GlobalStyles';
import Home from './views/Home';
import {ContextProvider} from "./contexts/ContextContext";
import {DccProvider} from "./contexts/DccContext";
import {EntityProvider} from "./contexts/EntityContext";
import { SnackbarProvider } from 'notistack';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ignite: {
      main: "rgb(252, 140, 3)",
    },
  },
  typography: {
    allVariants: {
      color: "lightgrey"
    }
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles styles={{ ...darkScrollbar() }} />
      <div className="App">
      <ContextProvider>
          <DccProvider>
            <EntityProvider>
              <SnackbarProvider maxSnack={3} autoHideDuration={2500}>
                <Home />
              </SnackbarProvider>
            </EntityProvider>
          </DccProvider>
        </ContextProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
