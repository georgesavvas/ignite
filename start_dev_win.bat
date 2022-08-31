cd backend
start src\bin\win\server.bat
start src\bin\win\client.bat
start src\bin\win\huey.bat
cd ..\frontend
start npm start
set NODE_ENV=dev
exit
