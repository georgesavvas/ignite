import time
import asyncio

LABEL = "Very heavy task"
EXTENSIONS = [".exr", ".jpg"]

async def main(entity, task_id, paused, killed, progress_fn=None):
    print("Starting very heavy task...")
    if progress_fn:
        await progress_fn(0)
    for i in range(1, 11):
        time.sleep(1)
        if task_id in paused:
            if progress_fn:
                await progress_fn(i / 10 * 100, state="paused")
            while task_id in paused:
                await asyncio.sleep(2)
            if progress_fn:
                await progress_fn(i / 10 * 100, state="running")
        if task_id in killed:
            await progress_fn(0, state="error")
            return
        if progress_fn:
            await progress_fn(i / 10 * 100)
        print(f"Progress - {i / 10 * 100}%")
    print("Finished very heavy task!")
    return "yep!"
