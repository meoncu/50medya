@echo off
title 50 Medya - Dev Server
cd /d "C:\Cursor\50medya"
echo 50 Medya baslatiliyor...
start "" "http://localhost:5050"
npm run dev
