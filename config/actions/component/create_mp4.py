import time
import logging

from pathlib import PurePath

LABEL = "Create MP4"
EXTENSIONS = [".exr", ".jpg", ".jpeg"]

LOGGER = logging.getLogger('huey')

def main(entity):
    from ignite_server.media import convert_img, encode
    
    input = PurePath(entity["path"])
    if input.suffix in [".exr"]:
        name = input.name.replace("_acescg", "")
        output = input.with_name(name).with_suffix(".jpg")
        convert_img(str(input), str(output))
        input = output
    stem = input.stem.split(".#")[0]
    output = input.with_stem(stem).with_suffix(".mp4")
    encode(str(input), str(output))
