import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@assets": resolve("src/renderer/src/assets"),
        "@components": resolve("src/renderer/src/components"),
        "@constants": resolve("src/renderer/src/constants"),
        "@contexts": resolve("src/renderer/src/contexts"),
        "@services": resolve("src/renderer/src/services"),
        "@utils": resolve("src/renderer/src/utils"),
        "@views": resolve("src/renderer/src/views"),
      },
    },
    plugins: [react()],
  },
});
