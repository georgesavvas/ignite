import { ElectronAPI } from "@electron-toolkit/preload";
import { api, services } from "./index";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof api;
    services: typeof services;
  }
}
