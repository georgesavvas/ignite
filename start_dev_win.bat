
ECHO OFF
cd backend
wt -w 0 nt -d . --tabColor "#1d34e0" .\src\bin\win\server.bat
wt -w 0 nt -d . --tabColor "#b6e01d" .\src\bin\win\client.bat
cd ../frontend
wt.exe -w 0 new-tab -d . --tabColor "#138017" cmd /k "title Node && npm start"
wt.exe -w 0 new-tab -d . --tabColor "#8f1111" cmd /k "title Electron && npm run electron"
exit
