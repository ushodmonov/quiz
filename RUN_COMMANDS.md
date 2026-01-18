# How to Run the Project

## Option 1: Using the provided scripts (Easiest)

### PowerShell:
```powershell
.\start-dev.ps1
```

### Command Prompt (CMD):
```cmd
start-dev.bat
```

## Option 2: Manual command (PowerShell)

If you prefer to run commands manually, use this in PowerShell:

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH; npm run dev
```

## Option 3: Manual command (Command Prompt / CMD)

```cmd
set PATH=C:\Program Files\nodejs;%PATH% && npm run dev
```

## First Time Setup

If you haven't installed dependencies yet, run this first (PowerShell):

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH; npm install
```

Or in CMD:
```cmd
set PATH=C:\Program Files\nodejs;%PATH% && npm install
```

## Access the Application

After starting the server, open your browser and go to:
- **http://localhost:5173** (or the URL shown in the terminal)

## Note

Node.js is not in your system PATH. The commands above temporarily add it for the current session. To fix this permanently:

1. Open System Properties → Advanced → Environment Variables
2. Edit the "Path" variable under System variables
3. Add: `C:\Program Files\nodejs`
4. Restart your terminal/IDE
