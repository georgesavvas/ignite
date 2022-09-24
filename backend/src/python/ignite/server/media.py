import os
import glob
import clique
import platform
import subprocess

from ignite.utils import get_logger
from ignite.server.constants import TOOLS, OS_NAMES


LOGGER = get_logger(__name__)
OS_NAME = OS_NAMES[platform.system()]


def convert_img(input, output):
    padding = input.count("#")
    files = glob.glob(input.replace("#" * padding, "*"))
    sequences, _ = clique.assemble(files)
    seq = sequences[0]
    indexes = list(seq.indexes)
    range = "{}-{}".format(indexes[0], indexes[-1])
    # input = input.replace("#" * padding, f"%0{padding}d")

    # padding = output.count("#")
    # output = output.replace("#" * padding, f"%0{padding}d")

    tool = TOOLS.get("oiiotool").get(OS_NAME)
    cmd = f"{tool} --frames {range} --framepadding {padding} {input} "
    # cmd += f"--colorconvert \"ACES - ACEScg\" \"Output - sRGB\" -o {output}"
    cmd += f"--autocc -o {output}"
    print(cmd)
    os.system(cmd)
    # exit_code = -1
    # try:
    #     exit_code = subprocess.check_call(
    #         cmd.split(),
    #         # stdout=subprocess.PIPE,
    #         # stderr=subprocess.STDOUT
    #     )
    # except Exception as e:
    #     print(exit_code, e)
    # return exit_code


def encode(input, output, fps=25):
    tool = TOOLS.get("ffmpeg").get(OS_NAME)

    cmd_frame = ""
    cmd_fps = ""

    if "#" in input:
        padding = input.count("#")
        files = glob.glob(input.replace("#" * padding, "*"))
        sequences, _ = clique.assemble(files)
        seq = sequences[0]
        seq_string = seq.format("{head}{padding}{tail}")
        cmd_frame = "-start_number {} ".format(list(seq.indexes)[0])
        cmd_fps = f"-r {fps} "
    else:
        seq_string = input
    cmd = f"{tool} {cmd_frame}-i {seq_string} -c:v libx264 {cmd_fps}-vf "
    cmd += f"scale=1280:-2 {output}"
    print(cmd)
    exit_code = -1
    try:
        exit_code = subprocess.check_call(
            cmd.split(),
            # stdout=subprocess.PIPE,
            # stderr=subprocess.STDOUT
        )
    except Exception as e:
        print(exit_code, e)
    return exit_code
