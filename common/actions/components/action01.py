import time

LABEL = "Heavy task"
EXTENSIONS = [".exr", ".jpg"]

def main(comp, asset, task):
    print("Starting heavy task...")
    time.sleep(10)
    print("Finished heavy task!")
