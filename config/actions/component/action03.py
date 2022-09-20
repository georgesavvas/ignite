import time

LABEL = "Very heavy task"
EXTENSIONS = [".exr", ".jpg"]

async def main(entity, progress_fn=None):
    print("Starting very heavy task...")
    if progress_fn:
        await progress_fn(0)
    for i in range(1, 6):
        time.sleep(1)
        if progress_fn:
            await progress_fn(i / 5 * 100)
        print(f"Progress - {i / 5 * 100}%")
    print("Finished very heavy task!")
    return "yep!"
