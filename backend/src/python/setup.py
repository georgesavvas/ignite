from setuptools import setup, find_packages

setup(
    name="ignite",
    version='0.1.0',
    packages=find_packages(include=["ignite_server", "ignite_client"])
)
