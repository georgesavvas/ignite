import os
import importlib
from pathlib import Path
from socket import gaierror


ENV = os.environ
DIR = os.path.dirname(__file__)

ignite_root = Path(DIR).parent.parent.parent.parent
ENV["IGNITE_ROOT"] = str(ignite_root)

IGNITE_SERVER_ADDRESS = ENV["IGNITE_SERVER_ADDRESS"]


from ignite_client.utils import HUEY
from ignite_client.api import run_action
