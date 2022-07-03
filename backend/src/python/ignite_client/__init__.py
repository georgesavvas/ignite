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

CONFIG_PATH = ignite_root / "common/client_config.yaml"
default_projects_root = str(Path.home() / "projects")
if not CONFIG_PATH.is_file():
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    config = {
        "projects_root": default_projects_root
    }
    with open(CONFIG_PATH, "w") as file:
        yaml.safe_dump(config, file)
else:
    with open(CONFIG_PATH, "r") as file:
        existing = yaml.safe_load(file) or {}
    if not existing.get("projects_root"):
        config = {
            "projects_root": default_projects_root
        }
        with open(CONFIG_PATH, "w") as file:
            yaml.safe_dump(config, file)
logging.info(f"Setting IGNITE_CLIENT_CONFIG_PATH to {CONFIG_PATH}")
ENV["IGNITE_CLIENT_CONFIG_PATH"] = str(CONFIG_PATH)

dcc = ignite_root / "dcc"
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
ENV["OCIO"] = str(ocio)

houdini_modules = str(dcc / "houdini/python")
if houdini_modules not in ENV.get("PYTHONPATH", ""):
    ENV["PYTHONPATH"] = houdini_modules + ";" + ENV.get("PYTHONPATH", "")
