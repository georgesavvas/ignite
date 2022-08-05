import os
import logging
import yaml
from pathlib import Path


logging.basicConfig(level=logging.DEBUG)


DIR = os.path.dirname(__file__)
ENV = os.environ

ignite_root = Path(DIR).parent.parent.parent.parent
logging.info(f"Setting IGNITE_ROOT to {ignite_root}")
ENV["IGNITE_ROOT"] = str(ignite_root)

default_config = {
    "server_address": "localhost:9070",
    "client_address": "localhost:9071",
    "projects_root": str(Path.home() / "projects")
}

CONFIG_PATH = ignite_root / "common/client_config.yaml"
if not CONFIG_PATH.is_file():
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w") as file:
        yaml.safe_dump(default_config, file)
else:
    with open(CONFIG_PATH, "r") as file:
        existing = yaml.safe_load(file) or {}
    existing_keys = list(existing.keys())
    changed = False
    for k, v in default_config.items():
        if k in existing_keys:
            continue
        existing[k] = v
        changed = True
    if changed:
        with open(CONFIG_PATH, "w") as file:
            yaml.safe_dump(existing, file)
logging.info(f"Setting IGNITE_CLIENT_CONFIG_PATH to {CONFIG_PATH}")
ENV["IGNITE_CLIENT_CONFIG_PATH"] = str(CONFIG_PATH)

dcc = ignite_root / "dcc"
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
ENV["OCIO"] = str(ocio)

houdini_modules = str(dcc / "houdini/python")
if houdini_modules not in ENV.get("PYTHONPATH", ""):
    ENV["PYTHONPATH"] = houdini_modules + ";" + ENV.get("PYTHONPATH", "")
