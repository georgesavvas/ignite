import shutil
from pathlib import Path

LABEL = "zip"

async def main(entity, state, progress_fn):
    await progress_fn(state="running")
    zip_dest = Path(entity["zip_dest"])
    zip_dest.parent.mkdir(exist_ok=True, parents=True)
    source_path = Path(entity["path"])
    shutil.make_archive(
        zip_dest.as_posix(),
        "zip",
        source_path.as_posix()
    )
    await progress_fn(100)
