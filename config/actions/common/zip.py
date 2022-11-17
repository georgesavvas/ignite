import shutil
from pathlib import Path

LABEL = "Very heavy task"
EXTENSIONS = [".exr", ".jpg"]

async def main(entity, state, progress_fn=None):
    zip_dest = Path(entity["zip_dest"])
    zip_dest.parent.mkdir(exist_ok=True, parents=True)
    source_path = Path(entity["path"])
    shutil.make_archive(
        zip_dest.as_posix(),
        "zip",
        source_path.parent.as_posix(),
        source_path.name
    )
