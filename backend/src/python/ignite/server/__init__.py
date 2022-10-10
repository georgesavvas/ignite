# Copyright 2022 George Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import logging
import os
import sys
import platform
from pathlib import Path

import yaml
from platformdirs import user_config_dir

logging.basicConfig(level=logging.DEBUG)

if getattr(sys, "frozen", False):
    DIR = sys._MEIPASS
else:
    DIR = os.path.dirname(os.path.abspath(__file__))
ENV = os.environ

OS_NAME = platform.system()
if OS_NAME == "Windows":
    OS_NAME = "win"
elif OS_NAME == "Darwin":
    OS_NAME = "darwin"
else:
    OS_NAME = "linux"

api_v = "v1"
logging.debug(f"Setting IGNITE_API_VERSION to {api_v}")
ENV["IGNITE_API_VERSION"] = api_v

ignite_root = Path(DIR)
if __file__.endswith(".py"):
    ignite_root = Path(DIR).parent.parent.parent.parent.parent
logging.debug(f"Setting IGNITE_ROOT to {ignite_root}")
ENV["IGNITE_ROOT"] = str(ignite_root)

# USER_CONFIG_PATH = Path(user_config_dir("ignite"))
USER_CONFIG_PATH = Path.home() / ".ignite"
if not USER_CONFIG_PATH.exists():
    USER_CONFIG_PATH.mkdir(parents=True, exist_ok=True)
logging.debug(f"Setting IGNITE_USER_CONFIG_PATH to {USER_CONFIG_PATH}")
ENV["IGNITE_USER_CONFIG_PATH"] = str(USER_CONFIG_PATH)

def ensure_config(filepath, default={}):
    if not filepath.is_file():
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w") as file:
            yaml.safe_dump(default, file)
    elif default:
        with open(filepath, "r") as file:
            existing = yaml.safe_load(file) or {}
        existing_keys = list(existing.keys())
        changed = False
        for k, v in default.items():
            if k in existing_keys:
                continue
            existing[k] = v
            changed = True
        if changed:
            with open(filepath, "w") as file:
                yaml.safe_dump(existing, file)

SERVER_USER_CONFIG_PATH = USER_CONFIG_PATH / "server_config.yaml"
ensure_config(SERVER_USER_CONFIG_PATH, {
    "server_address": "0.0.0.0:9070",
    "projects_root": str(Path.home() / "projects"),
    "vault_name": "__vault__"
})

logging.debug(f"Setting IGNITE_SERVER_USER_CONFIG_PATH to {SERVER_USER_CONFIG_PATH}")
logging.debug(f"Setting IGNITE_SERVER_ROOT to {DIR}")
ENV["IGNITE_SERVER_USER_CONFIG_PATH"] = str(SERVER_USER_CONFIG_PATH)
ENV["IGNITE_SERVER_ROOT"] = DIR

CONFIG_PATH = ignite_root / "config"
logging.debug(f"Setting IGNITE_CONFIG_PATH to {CONFIG_PATH}")
ENV["IGNITE_CONFIG_PATH"] = str(CONFIG_PATH)

dcc = CONFIG_PATH / "dcc"
logging.debug(f"Setting IGNITE_DCC to {dcc}")
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
logging.debug(f"Setting OCIO to {ocio}")
ENV["OCIO"] = str(ocio)

tools = ignite_root / "tools" / OS_NAME
logging.debug(f"Setting IGNITE_TOOLS to {tools}")
ENV["IGNITE_TOOLS"] = str(tools)

if tools.is_dir():
    s = ";".join([str(x) for x in tools.iterdir() if x.is_dir()])
    ENV["PATH"] = s + ";" + str(tools) + ";" + ENV.get("PATH", "")
