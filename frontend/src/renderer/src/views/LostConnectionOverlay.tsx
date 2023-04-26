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

import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useContext, useEffect, useState } from "react";

import IgnButton from "../components/IgnButton";
import IgnTextField from "../components/IgnTextField";
import { Access, ConfigContext, ConfigContextType } from "../contexts/ConfigContext";
import styles from "./LostConnectionOverlay.module.css";

type SettingsType = {
  serverDetails: {
    address: string;
    password: string;
  };
  access?: {};
};

const LostConnectionOverlay = () => {
  const { config, setConfig } = useContext(ConfigContext) as ConfigContextType;
  const [settings, setSettings] = useState<SettingsType>({
    serverDetails: { address: "", password: "" },
    access: {},
  });
  const [canSave, setCanSave] = useState(false);
  const [canRestart, setCanRestart] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(1);
    setSettings({
      serverDetails: {
        address: config.serverDetails.address,
        password: config.serverDetails.password,
      },
    });
    setTimeout(() => setCanRestart(true), 5000);
  }, [config.serverDetails]);

  useEffect(() => {
    let changed = false;
    if (JSON.stringify(config.serverDetails) !== JSON.stringify(settings.serverDetails))
      changed = true;
    setCanSave(changed);
  }, [settings]);

  const handleServerDetailsChange = (field: keyof SettingsType["serverDetails"], value: string) => {
    setSettings((prevState) => {
      const existing = { ...prevState };
      existing["serverDetails"][field] = value;
      return existing;
    });
  };

  const handleSave = () => {
    setConfig("serverDetails", { ...settings.serverDetails }, "modify");
    if (settings.access) setConfig("access", { ...(settings.access as Access) }, "modify");
    setCanSave(false);
  };

  const handleReset = () => {
    setSettings({
      serverDetails: {
        address: config.serverDetails.address,
        password: config.serverDetails.password,
      },
    });
  };

  const handleRestart = () => {
    setCanRestart(false);
    window.services.check_backend();
    setTimeout(() => setCanRestart(true), 5000);
  };

  return (
    <div className={styles.container} style={{ opacity: opacity }}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Typography variant="h4">Lost connection to Ignite server...</Typography>
          <LinearProgress
            color="ignite"
            style={{ visibility: canRestart ? "hidden" : "visible" }}
          />
        </div>
        <IgnTextField
          label="Server address"
          id="server-address"
          style={{ minWidth: "300px" }}
          value={settings.serverDetails.address || ""}
          onChange={(e) => handleServerDetailsChange("address", e.target.value)}
        />
        <IgnTextField
          label="Server password"
          type="password"
          id="server-password"
          style={{ minWidth: "300px" }}
          value={settings.serverDetails.password || ""}
          onChange={(e) => handleServerDetailsChange("password", e.target.value)}
        />
        <div className={styles.buttonsRow}>
          <IgnButton disabled={!canSave} onClick={() => handleReset()}>
            Reset
          </IgnButton>
          <IgnButton disabled={!canSave} color="ignite" onClick={() => handleSave()}>
            Save
          </IgnButton>
          <IgnButton disabled={!canRestart} color="ignite" onClick={handleRestart}>
            Restart server
          </IgnButton>
        </div>
      </div>
    </div>
  );
};

export default LostConnectionOverlay;
