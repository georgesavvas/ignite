import os
from pathlib import Path


DIR = os.path.dirname(__file__)
ENV = os.environ

ENV["IGNITE_CONFIG_PATH"] = str(Path.home() / ".ignite/server_config.yaml")

dcc = Path(DIR).parent.parent.parent.parent / "dcc"
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
ENV["OCIO"] = str(ocio)

houdini_modules = str(dcc / "houdini/python")
if not houdini_modules in ENV["PYTHONPATH"]:
    ENV["PYTHONPATH"] = houdini_modules + ";" + ENV["PYTHONPATH"]
