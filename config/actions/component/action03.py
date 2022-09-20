import time
import asyncio

LABEL = "Very heavy task"
EXTENSIONS = [".exr", ".jpg"]

async def main(entity, state, progress_fn=None):
    print("Starting very heavy task...")
    if progress_fn:
        await progress_fn(state="running")
    for i in range(1, 11):
        time.sleep(1)
        if state["paused"]:
            if progress_fn:
                await progress_fn(state="paused")
            while state["paused"]:
                await asyncio.sleep(2)
            if progress_fn:
                await progress_fn(state="running")
        if state["killed"]:
            await progress_fn(state="error")
            return
        # if progress_fn:
        #     await progress_fn(i / 10 * 100)
        # print(f"Progress - {i / 10 * 100}%")
    print("Finished very heavy task!")
    return "yep!"
