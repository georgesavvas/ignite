import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    ignite: Palette["primary"];
    lightgrey: Palette["primary"];
  }

  interface PaletteOptions {
    ignite: PaletteOptions["primary"];
    lightgrey: PaletteOptions["primary"];
  }
}

declare module "@mui/material" {
  interface ButtonPropsColorOverrides {
    ignite: true;
    lightgrey: true;
  }
  interface LinearProgressPropsColorOverrides {
    ignite: true;
  }
  interface CheckboxPropsColorOverrides {
    ignite: true;
  }
  interface SwitchPropsColorOverrides {
    ignite: true;
  }
  interface CircularProgressPropsColorOverrides {
    ignite: true;
  }
  interface InputBasePropsColorOverrides {
    ignite: true;
    error: true;
  }
}

export const igniteTheme = createTheme({
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
      color: "lightgrey",
    },
  },
});
