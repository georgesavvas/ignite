import os
import logging
from pathlib import Path


logging.basicConfig(level=logging.DEBUG)


DIR = os.path.dirname(__file__)
ENV = os.environ

ENV["IGNITE_CONFIG_PATH"] = str(Path.home() / ".ignite/server_config.yaml")

ignite_root = Path(DIR).parent.parent.parent.parent
ENV["IGNITE_ROOT"] = str(ignite_root)

dcc = ignite_root / "dcc"
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
ENV["OCIO"] = str(ocio)

houdini_modules = str(dcc / "houdini/python")
if houdini_modules not in ENV.get("PYTHONPATH", ""):
    ENV["PYTHONPATH"] = houdini_modules + ";" + ENV.get("PYTHONPATH", "")
