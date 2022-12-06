import time
import logging

from pathlib import PurePath

LABEL = "Create JPEGs"
EXTENSIONS = [".exr"]

LOGGER = logging.getLogger('huey')

def main(entity, state, progress_fn=None):
    from ignite_server.media import convert_img
    
    input = PurePath(entity["path"])
    name = input.name.replace("_acescg", "")
    output = input.with_name(name).with_suffix(".jpg")
    convert_img(str(input), str(output))
