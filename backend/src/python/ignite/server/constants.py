TOOLS = {
    "oiiotool": {
        "win": "oiiotool.exe",
        "darwin": "oiiotool",
        "linux": "oiiotool"
    },
    "ffmpeg": {
        "win": "ffmpeg.exe",
        "darwin": "ffmpeg",
        "linux": "ffmpeg"
    }
}

OS_NAMES = {
    "Windows": "win",
    "Darwin": "darwin",
    "Linux": "linux"
}

TAG_WEIGHTS = {
    "approved": 1,
    "deprecated": -100
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

ANCHORS = {
    "project": ".ign_project.yaml",
    "group": ".ign_group.yaml",
    "directory": ".ign_dir.yaml",
    "build": ".ign_build.yaml",
    "sequence": ".ign_sequence.yaml",
    "shot": ".ign_shot.yaml",
    "task": ".ign_task.yaml",
    "asset": ".ign_asset.yaml",
    "scene": ".ign_scene.yaml",
    "assetversion": ".ign_assetversion.yaml"
}

DCC_EXTENSIONS = {
    "houdini": ["hip", "hipnc"],
    "maya": ["ma", "mb"],
    "nuke": ["nk"],
    "natron": ["ntp"],
    "substance_designer": ["sbs"],
    "substance_painter": [],
    "blender": ["blend"]
}

COMP_TYPES = {
    "usd": ["usd", "usdz", "usdc", "usda"]
}
