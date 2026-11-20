@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FireGuard Sim - 消防预警模拟平台
set "FG_NODE="
if exist "%ProgramFiles%\nodejs\node.exe" set "FG_NODE=%ProgramFiles%\nodejs\node.exe"
if not defined FG_NODE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "FG_NODE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if not defined FG_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "FG_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined FG_NODE for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined FG_NODE set "FG_NODE=%%N"
if not defined FG_NODE (
  echo 请先安装 Node.js LTS：https://nodejs.org/zh-cn/download
  echo 安装完成后重新双击此文件。
  pause
  exit /b 1
)
"%FG_NODE%" "%~dp0serve.cjs"
if errorlevel 1 (
  echo.
  echo 启动未完成，请查看上方提示。
  pause
)
