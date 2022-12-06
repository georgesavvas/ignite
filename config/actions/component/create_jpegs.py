import time
import logging

from pathlib import PurePath
from ignite.server.media import convert_img

LABEL = "Create JPEGs"
EXTENSIONS = [".exr"]

LOGGER = logging.getLogger('huey')

async def main(entity, state, progress_fn):
    await progress_fn(state="running")
    input = PurePath(entity["path"])
    name = input.name.replace("_acescg", "")
    output = input.with_name(name).with_suffix(".jpg")
    convert_img(str(input), str(output))
    await progress_fn(100)
