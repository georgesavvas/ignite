import './App.css';
import 'react-reflex/styles.css'
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import darkScrollbar from '@mui/material/darkScrollbar';
import GlobalStyles from '@mui/material/GlobalStyles';
import Home from './pages/Home';
import {ProjectProvider} from "./contexts/ProjectContext";
import {ContextProvider} from "./contexts/ContextContext";
import {AssetProvider} from "./contexts/AssetContext";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
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
            <AssetProvider>
              <Home />
            </AssetProvider>
          </ContextProvider>
        </ProjectProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
