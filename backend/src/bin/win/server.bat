git pull --ff-only
title "IGNITE SERVER"
%0\..\..\..\..\env\Scripts\activate && ^
cd %0\..\..\..\python && ^
python -m ignite.server_main
PAUSE
