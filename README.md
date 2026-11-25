# New Hire 3D

A first-person 3D job simulator where you learn real skills by doing the job: IT help desk, cybersecurity, software development, logistics, warehouse, sales, accounting, HR, management, customer support, marketing, data analytics, hospital ward, restaurant kitchen, retail and banking.

## Play

- **Windows:** download `New-Hire-3D-Setup-x.y.z.exe` from [Releases](https://github.com/emreaba06-ctrl/new_hire_3d/releases) and run it. The app checks for updates every time it starts and installs them for you. Saves are kept between updates.
- Windows may show "Windows protected your PC" because the app isn't code-signed. Click **More info → Run anyway**.

Controls: WASD or arrow keys to move, mouse to look, E to interact, P for photo mode, F11 fullscreen. Game controllers work too.

## Project layout

| Path | What it is |
| --- | --- |
| `game/src/` | Game source (Three.js r128). `build.py` joins everything into one page. |
| `game/legacy/newhire.html` | The original 2D game; the build reuses its CSS, widgets and job content. |
| `game/models/` | Characters and furniture (glTF JSON with embedded buffers). |
| `game/vo/` | Recorded voice lines and `index.json`. |
| `game/lib/` | Three.js, GLTFLoader and SkeletonUtils, so the desktop app runs offline. |
| `desktop/` | Electron shell with auto-update (electron-updater + GitHub Releases). |
| `tools/assemble.py` | Builds the game and copies it into `desktop/game`. |

## Build

```bash
python game/src/build.py          # writes game/dist/index.html (web version)
python tools/assemble.py          # prepares desktop/game for the app
cd desktop && npm install && npm start
```

## Release a new version

1. Bump `"version"` in `desktop/package.json` (for example `1.0.1`).
2. Commit, then tag and push: `git tag v1.0.1 && git push origin main --tags`.
3. GitHub Actions builds the installer on Windows and publishes the release. Installed copies update on their next launch.
