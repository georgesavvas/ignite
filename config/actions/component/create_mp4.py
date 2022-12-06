import time
import logging

from pathlib import PurePath
from ignite.server.media import convert_img, encode

LABEL = "Create MP4"
EXTENSIONS = [".exr", ".jpg", ".jpeg"]

LOGGER = logging.getLogger('huey')

async def main(entity, state, progress_fn):
    await progress_fn(state="running")
    input = PurePath(entity["path"])
    if input.suffix in [".exr"]:
        name = input.name.replace("_acescg", "")
        output = input.with_name(name).with_suffix(".jpg")
        convert_img(str(input), str(output))
        input = output
    stem = input.stem.split(".#")[0]
    output = input.with_stem(stem).with_suffix(".mp4")
    encode(str(input), str(output))
    await progress_fn(100)
