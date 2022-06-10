import time

LABEL = "Very heavy task"
EXTENSIONS = [".exr", ".jpg"]

def main(comp, asset, task):
    print("Starting very heavy task...")
    time.sleep(15)
    print("Finished very heavy task!")
