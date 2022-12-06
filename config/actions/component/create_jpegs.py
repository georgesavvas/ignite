import time
import logging

from pathlib import PurePath
from ignite.logger import get_logger
from ignite.server.media import convert_img

LABEL = "Create JPEGs"
EXTENSIONS = [".exr"]

LOGGER = get_logger(__name__)

async def main(entity, state, progress_fn):
    await progress_fn(state="running")
    input = PurePath(entity["path"])
    name = input.name.replace("_acescg", "")
    output = input.with_name(name).with_suffix(".jpg")
    LOGGER.debug(f"Converting {input} to {output}")
    convert_img(str(input), str(output))
    await progress_fn(100)
