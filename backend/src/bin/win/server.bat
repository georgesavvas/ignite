git pull --ff-only
title "Server"
%0\..\..\..\..\env\Scripts\activate && ^
cd %0\..\..\..\python && ^
python -m ignite.server_main
PAUSE
