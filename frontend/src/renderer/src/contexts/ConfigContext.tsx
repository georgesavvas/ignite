// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { GenericObject } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import { PropsWithChildren, createContext, useEffect, useRef, useState } from "react";

import clientRequest from "../services/clientRequest";
import serverRequest from "../services/serverRequest";

export type ServerDetails = {
  address: string;
  password: string;
};

export type Access = {
  remote?: boolean;
  projectsDir: string;
  serverProjectsDir: string;
};

export type DccConfig = any[];

export type Config = {
  serverDetails: ServerDetails;
  access: Access;
  dccConfig: DccConfig;
  clientAddress?: string;
  connection: boolean;
  ready: boolean;
  write: boolean;
};

type SetConfig = (
  setting: "serverDetails" | "access" | "dccConfig",
  data: ServerDetails | Access | DccConfig,
  operation?: "modify" | "add" | "remove",
) => void;

export type ConfigContextType = {
  config: Config;
  setConfig: SetConfig;
};

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const serverDetailsDefault = {
  address: "localhost",
  password: "",
};

const accessDefault = {
  remote: false,
  projectsDir: "",
  serverProjectsDir: "",
};

const placeholder_config = {
  path: "",
  exts: "",
  name: "",
};

export const ConfigProvider = ({ children }: PropsWithChildren) => {
  const serverIsLocal = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const { enqueueSnackbar } = useSnackbar();
  const [config, setConfig] = useState<Config>({
    serverDetails: serverDetailsDefault,
    access: accessDefault,
    dccConfig: [],
    connection: false,
    ready: false,
    write: false,
  });

  useEffect(() => setupConfig(), []);

  const heartbeat = () => {
    const serverName = serverIsLocal.current ? "server/client" : "server";
    serverRequest("ping").then((resp) => {
      if (!resp?.ok) {
        if (!config.connection) return;
        console.log(`Lost connection to ${serverName}...`);
        enqueueSnackbar("Lost connection to server...", { variant: "error" });
        setConfig((prev) => {
          const existing = { ...prev };
          existing["connection"] = false;
          existing["write"] = false;
          return existing;
        });
      } else {
        if (config.connection) return;
        if (config.ready) {
          console.log(`${serverName} connection restored...`);
          enqueueSnackbar("Connection restored!", { variant: "success" });
          setupConfig();
        } else {
          enqueueSnackbar("Connected!", { variant: "success" });
        }
        setConfig((prev) => {
          const existing = { ...prev };
          existing["connection"] = true;
          existing["ready"] = true;
          existing["write"] = false;
          return existing;
        });
      }
    });
    if (serverIsLocal.current) return;
    clientRequest("ping").then((resp) => {
      if (!resp?.ok) {
        if (!config.connection) return;
        console.log("Lost connection to client...");
        // window.services.check_backend();
      }
    });
  };

  useEffect(() => {
    heartbeat();
    intervalRef.current = setInterval(() => {
      heartbeat();
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config.connection, config.ready]);

  useEffect(() => {
    if (!config.write) return;
    if (config.connection) handleConfigChange(config);
  }, [config.serverDetails, config.access, config.dccConfig]);

  const setupConfig = () => {
    if (!window.services) return;
    console.log("CONFIG SETUP");
    const clientData = clientRequest("get_config");
    const clientAddress = window.services.get_env("IGNITE_CLIENT_ADDRESS");
    const serverPort = window.services.get_port();
    Promise.all([clientData, clientAddress, serverPort]).then((resp) => {
      if (!resp[0] || !resp[0].ok) return;
      const clientDataResults = resp[0].data;
      console.log("Config received:", clientDataResults);
      const savedServerDetails = clientDataResults.server_details;
      let savedServerAddress = savedServerDetails.address;
      const port = resp[2];
      console.log({ port });
      serverDetailsDefault.address += `:${port}`;
      if (["localhost", "0.0.0.0"].includes(savedServerAddress)) {
        console.log(`Local server port not defined, fetched ${port}`);
        savedServerAddress += `:${port}`;
      }
      const finalServerDetails = {
        ...serverDetailsDefault,
        ...savedServerDetails,
        address: savedServerAddress,
      };
      const serverIsLocal_ =
        savedServerAddress.startsWith("localhost") || savedServerAddress.startsWith("0.0.0.0");
      serverIsLocal.current = serverIsLocal_;
      console.log("finalServerDetails", finalServerDetails);
      const savedAccess = {
        projectsDir: clientDataResults.access.projects_root,
        serverProjectsDir: clientDataResults.access.server_projects_root,
        remote: clientDataResults.access.remote,
      };
      const savedDccConfig = clientDataResults.dcc_config;
      window.services.set_envs({
        IGNITE_SERVER_ADDRESS: finalServerDetails.address,
        IGNITE_SERVER_PASSWORD: finalServerDetails.password,
      });
      setConfig({
        serverDetails: finalServerDetails,
        access: {
          ...accessDefault,
          ...savedAccess,
        },
        dccConfig: savedDccConfig,
        clientAddress: resp[1],
        write: false,
        connection: false,
        ready: false,
      });
    });
  };

  const handleConfigChange = async (c: Config) => {
    console.log("CONFIG HAS BEEN MODIFYING AND SHOULD WRITE");
    let serverAddress = c.serverDetails.address;
    if (serverAddress === "localhost" || serverAddress === "0.0.0.0") {
      console.log("Local server port not defined, fetching from main process");
      const port = await window.services.get_port();
      serverAddress += `:${port}`;
      console.log(`Port is ${port}, new address is ${serverAddress}`);
    }
    window.services.set_envs({
      IGNITE_SERVER_ADDRESS: serverAddress,
      IGNITE_SERVER_PASSWORD: c.serverDetails.password,
    });
    const serverIsLocal_ =
      serverAddress.startsWith("localhost") || serverAddress.startsWith("0.0.0.0");
    serverIsLocal.current = serverIsLocal_;
    const accessFormatted = {
      projects_root: c.access.projectsDir,
      server_projects_root: serverIsLocal_ ? c.access.projectsDir : c.access.serverProjectsDir,
      remote: c.access.remote,
    };
    const data = {
      access: accessFormatted,
      dcc_config: c.dccConfig,
      server_details: c.serverDetails,
    };
    console.log("Setting config:", data);
    clientRequest("set_config", { data: data });
  };

  const addToDCCConfig = (config: DccConfig, data: GenericObject) => {
    if (!data || !data.length) {
      return [placeholder_config, ...config];
    }
    let existing_paths = [] as string[];
    config.forEach((existing) => {
      existing_paths.push(existing.path);
    });
    const filtered = data.filter(
      (new_config: GenericObject) => !existing_paths.includes(new_config.path),
    );
    return [...config, ...filtered];
  };

  const removeFromDCCConfig = (config: DccConfig, data: GenericObject) => {
    let cc = [...config];
    cc.splice(data.index, 1);
    return cc;
  };

  const handleSetServerDetails = (data: ServerDetails) => {
    setConfig((prev) => ({
      ...prev,
      write: true,
      serverDetails: { ...prev.serverDetails, ...data },
    }));
  };

  const handleSetAccess = (data: Access) => {
    setConfig((prev) => ({
      ...prev,
      write: true,
      access: { ...prev.access, ...data },
    }));
  };

  const handleSetDccConfig = (data: DccConfig, operation = "modify") => {
    switch (operation) {
      default: {
        setConfig((prev) => ({
          ...prev,
          write: true,
          dccConfig: data,
        }));
        break;
      }
      case "add": {
        setConfig((prev) => ({
          ...prev,
          write: true,
          dccConfig: addToDCCConfig(prev.dccConfig, data),
        }));
        break;
      }
      case "remove": {
        setConfig((prev) => ({
          ...prev,
          write: true,
          dccConfig: removeFromDCCConfig(prev.dccConfig, data),
        }));
        break;
      }
    }
  };

  const handleSetConfig = (
    setting: "serverDetails" | "access" | "dccConfig",
    data: ServerDetails | Access | DccConfig,
    operation: "add" | "remove" | "modify" = "modify",
  ) => {
    switch (setting) {
      case "serverDetails": {
        handleSetServerDetails(data as ServerDetails);
        break;
      }
      case "access": {
        handleSetAccess(data as Access);
        break;
      }
      case "dccConfig": {
        handleSetDccConfig(data as DccConfig, operation);
        break;
      }
      default:
        return;
    }
  };

  return (
    <ConfigContext.Provider value={{ config, setConfig: handleSetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};
