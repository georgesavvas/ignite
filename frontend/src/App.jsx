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

function App() {
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   setTimeout(() => {
  //     setIsLoading(false);
  //   }, 3000);
  // }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles styles={{ ...darkScrollbar() }} />
      {/* { isLoading ? <Splash onFinished={() => setIsLoading(false)} /> : null } */}
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
