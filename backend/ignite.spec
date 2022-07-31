# -*- mode: python ; coding: utf-8 -*-


block_cipher = None

server_a = Analysis(
    ['src\\python\\server_main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
server_pyz = PYZ(server_a.pure, server_a.zipped_data, cipher=block_cipher)
server_exe = EXE(
    server_pyz,
    server_a.scripts,
    [],
    exclude_binaries=True,
    name='IgniteServer',
    icon="icon.ico",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    noconfirm=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

client_a = Analysis(
    ['src\\python\\client_main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
client_pyz = PYZ(client_a.pure, client_a.zipped_data, cipher=block_cipher)
client_exe = EXE(
    client_pyz,
    client_a.scripts,
    [],
    exclude_binaries=True,
    name='IgniteClientBackend',
    icon="icon.ico",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    noconfirm=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    server_exe,
    server_a.binaries,
    server_a.zipfiles,
    server_a.datas,
    client_exe,
    client_a.binaries,
    client_a.zipfiles,
    client_a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='backend',
)
