cd %0\backend
echo %cd%
wt.exe -w 0 nt -d . --tabColor "#1d34e0" .\src\bin\win\server.bat
wt.exe -w 0 nt -d . --tabColor "#b6e01d" .\src\bin\win\client.bat
cd %0\frontend
echo %cd%
wt.exe -w 0 nt -d . --tabColor "#8f1111" .\bin\win\electron.bat
wt.exe -w 0 nt -d . --tabColor "#138017" .\bin\win\node.bat
exit
