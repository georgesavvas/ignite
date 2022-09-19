import time

LABEL = "Very heavy task"
EXTENSIONS = [".exr", ".jpg"]

def main(entity, progress_fn=None):
    print("Starting very heavy task...")
    for i in range(1, 6):
        time.sleep(1)
        if progress_fn:
            progress_fn(i / 5 * 100)
    print("Finished very heavy task!")
    return "yep!"
