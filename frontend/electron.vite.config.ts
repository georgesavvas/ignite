import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@components": resolve("src/renderer/src/components"),
        "@constants": resolve("src/renderer/src/constants"),
        "@contexts": resolve("src/renderer/src/contexts"),
        "@services": resolve("src/renderer/src/services"),
        "@utils": resolve("src/renderer/src/utils"),
        "@views": resolve("src/renderer/src/views")
      }
    },
    plugins: [react()]
  }
});
