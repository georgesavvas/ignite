import time

LABEL = "Light task"
EXTENSIONS = [".exr", ".jpg"]

def main(comp, asset, task):
    print("Starting light task...")
    print(f"Processing {comp}")
    print(f"From {asset}")
    print(f"From {task}")
    time.sleep(3)
    print("Finished light task!")
