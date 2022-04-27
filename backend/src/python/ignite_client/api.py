import os
import logging
import platform
import yaml
import subprocess
import requests
from pathlib import PurePath, Path
from pprint import pprint
from ignite_client.constants import GENERIC_ENV, DCC_ENVS, OS_NAMES


ENV = os.environ
IGNITE_DCC = Path(os.environ["IGNITE_DCC"])
CONFIG_PATH = Path(Path.home(), ".ignite")
if not CONFIG_PATH.exists():
    CONFIG_PATH.mkdir()
IGNITE_SERVER_HOST = ENV["IGNITE_SERVER_HOST"]
IGNITE_SERVER_PORT = ENV["IGNITE_SERVER_PORT"]


def ingest(data):
    pprint(data)
