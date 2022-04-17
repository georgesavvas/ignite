TOOLS = {
    "oiiotool": {
        "win": "oiiotool.exe",
        "mac": "oiiotool",
        "linux": "oiiotool"
    },
    "ffmpeg": {
        "win": "ffmpeg.exe",
        "mac": "ffmpeg",
        "linux": "ffmpeg"
    }
}

OS_NAMES = {
    "Windows": "win",
    "Debian": "mac",
    "Linux": "linux"
}

MP4_CONFIG = (
        '-start_number {sframe}',
        '-r {fps}',
        '-i {filepath}',
        '-f image2',
        '-c:v libx264',
        '-vf scale=720:-2',
        '-profile:v main',
        '-crf 10',
        '-vendor ap10',
        '{output}',
    )
# cmd = "ffmpeg " + " ".join(CONFIGS[output_format]).format(
#         filepath=filepath,
#         fps=env.get("FPS", 25),
#         sframe=env.get("START_FRAME", 1001),
#         output=output
#     )

# if "clique" in str(type(sequence)):
#         seq_string = os.path.join(input_path, sequence.format("{head}{padding}{tail}"))
#         cmd_frame = "-start_number {} ".format(sequence.indexes[0])
#         cmd_fps = "-r 25 "
#     else:
#         seq_string = input_path
#     cmd = "ffmpeg {}-i {} -c:v libx264 {}-vf scale=1280:-2 {}".format(
#         cmd_frame,
#         seq_string,
#         cmd_fps,
#         output_path
#     )
#     exit_code = -1
#     try:
#         exit_code = subprocess.check_call(
#             cmd.split(),
#             stdout=subprocess.PIPE,
#             stderr=subprocess.STDOUT
#         )
