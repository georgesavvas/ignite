title "IGNITE WORKER"
cd %0\..\..\..\python
..\..\env\Scripts\activate && huey_consumer ignite_client.huey.HUEY -S
PAUSE
