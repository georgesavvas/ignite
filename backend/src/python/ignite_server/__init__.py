import os
import platform
import yaml
import logging
from pathlib import Path
from platformdirs import user_config_dir

logging.basicConfig(level=logging.DEBUG)

DIR = os.path.dirname(__file__)
ENV = os.environ

OS_NAME = platform.system()
if OS_NAME == "Windows":
    OS_NAME = "win"
elif OS_NAME == "Darwin":
    OS_NAME = "darwin"
else:
    OS_NAME = "linux"

api_v = "v1"
logging.info(f"Setting IGNITE_API_VERSION to {api_v}")
ENV["IGNITE_API_VERSION"] = api_v

ignite_root = Path(DIR).parent.parent.parent.parent
logging.info(f"Setting IGNITE_ROOT to {ignite_root}")
ENV["IGNITE_ROOT"] = str(ignite_root)

# CONFIG_PATH = Path(user_config_dir("ignite"))
CONFIG_PATH = Path.home() / ".ignite"
if not CONFIG_PATH.exists():
    CONFIG_PATH.mkdir(parents=True, exist_ok=True)
logging.info(f"Setting IGNITE_CONFIG_PATH to {CONFIG_PATH}")
ENV["IGNITE_CONFIG_PATH"] = str(CONFIG_PATH)

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

SERVER_CONFIG_PATH = CONFIG_PATH / "server_config.yaml"
ensure_config(SERVER_CONFIG_PATH, {
    "server_address": "0.0.0.0:9070",
    "projects_root": str(Path.home() / "projects")
})

logging.info(f"Setting IGNITE_SERVER_CONFIG_PATH to {SERVER_CONFIG_PATH}")
logging.info(f"Setting IGNITE_SERVER_ROOT to {DIR}")
ENV["IGNITE_SERVER_CONFIG_PATH"] = str(SERVER_CONFIG_PATH)
ENV["IGNITE_SERVER_ROOT"] = DIR

dcc = ignite_root / "dcc"
logging.info(f"Setting IGNITE_DCC to {dcc}")
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
logging.info(f"Setting OCIO to {ocio}")
ENV["OCIO"] = str(ocio)

tools = ignite_root / "tools" / OS_NAME
logging.info(f"Setting IGNITE_TOOLS to {tools}")
ENV["IGNITE_TOOLS"] = str(tools)

if tools.is_dir():
    s = ";".join([str(x) for x in tools.iterdir() if x.is_dir()])
    ENV["PATH"] = s + ";" + str(tools) + ";" + ENV.get("PATH", "")
