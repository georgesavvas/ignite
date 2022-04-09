import './App.css';
import 'react-reflex/styles.css'
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import darkScrollbar from '@mui/material/darkScrollbar';
import GlobalStyles from '@mui/material/GlobalStyles';
import Home from './pages/Home';
import {ProjectProvider} from "./contexts/ProjectContext";
import {ContextProvider} from "./contexts/ContextContext";
import {EntityProvider} from "./contexts/EntityContext";

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
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles styles={{ ...darkScrollbar() }} />
      <div className="App">
        <ProjectProvider>
          <ContextProvider>
            <EntityProvider>
              <Home />
            </EntityProvider>
          </ContextProvider>
        </ProjectProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
