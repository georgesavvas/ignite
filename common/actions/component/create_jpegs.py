import time
import logging

from pathlib import PurePath

LABEL = "Create JPEGs"
EXTENSIONS = [".exr"]

LOGGER = logging.getLogger('huey')

def main(entity):
    from ignite_server.media import convert_img
    
    input = PurePath(entity["path"])
    output = input.with_suffix(".jpg")
    convert_img(str(input), str(output))
