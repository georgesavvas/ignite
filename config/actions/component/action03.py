import time

LABEL = "Very heavy task"
EXTENSIONS = [".exr", ".jpg"]

def main(entity):
    print("Starting very heavy task...")
    time.sleep(5)
    print("Finished very heavy task!")
    return "yep!"
