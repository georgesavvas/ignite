---
sidebar_position: 0
---

# Installation
## Setting up ignite on a single workstation
Once Ignite is installed and launched, it will prompt you for a projects directory. This is where your Ignite-managed projects will live in. Even though an ignite project is simply a directory tree, each directory contains useful metadata that tells Ignite how to traverse the project and how to treat each level. As such it is advised you choose an empty directory and either create projects from scratch or recreate existing ones by copying over your scenes and assets. A tool to assist with the migration of existing non Ignite projects is in concept stage.

## Software discovery
Ignite will initially attempt to find any supported applications that can be used to create and edit scenes. If any of your apps are installed in custom directories you will have to manually tell Ignite where to find it by using the DCC tab in the Settings dialogue. This is especially true for Linux systems where installation directories are less standardised.

## Advanced setup
The Ignite Server can function separately to the UI. This is useful when you want the server to run on a different box (for example a raspberry pi) and serve content to actual workstations. In that case the UI can be set up to connect to the existing server as opposed to firing up its own.

Start by installing Ignite on both your server box and your workstation.
On the server box launch the IgniteServer application.
On the workstation, launch Ignite and open up the Settings dialogue from the top right gear icon. Fill in the server address field using the local IP address of your server box and you are good to go :)