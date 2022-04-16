import os


DIR = os.path.dirname(__file__)
ENV = os.environ

ENV["IGNITE_CONFIG_PATH"] = os.path.join(DIR, "config.yaml")
ENV["IGNITE_ROOT"] = DIR
