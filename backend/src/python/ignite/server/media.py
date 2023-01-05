# Copyright 2022 Georgios Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import glob
import os
import platform
import subprocess

import clique
from ignite.server.constants import OS_NAMES, TOOLS
from ignite.logger import get_logger

LOGGER = get_logger(__name__)
OS_NAME = OS_NAMES[platform.system()]


def convert_img(input, output):
    tool = TOOLS.get("oiiotool").get(OS_NAME)
    if "#" in input:
        padding = input.count("#")
        files = glob.glob(input.replace("#" * padding, "*"))
        sequences, _ = clique.assemble(files)
        seq = sequences[0]
        indexes = list(seq.indexes)
        range = "{}-{}".format(indexes[0], indexes[-1])
        # input = input.replace("#" * padding, f"%0{padding}d")
        # padding = output.count("#")
        # output = output.replace("#" * padding, f"%0{padding}d")
        cmd = f"{tool} --frames {range} --framepadding {padding} {input} "
    else:
        cmd = f"{tool} {input} "
    # cmd += f"--colorconvert \"ACES - ACEScg\" \"Output - sRGB\" -o {output}"
    # cmd += "--autocc "
    cmd += "--ch R,G,B "
    cmd += f"-o {output}"
    LOGGER.debug(cmd)
    LOGGER.warning(os.environ.get("OCIO"))
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
