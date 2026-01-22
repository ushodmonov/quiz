@echo off
REM Batch script to start the development server
REM This script adds Node.js to PATH and starts the dev server

set PATH=C:\Program Files\nodejs;%PATH%
call npm run dev
