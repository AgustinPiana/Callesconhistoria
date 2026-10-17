@echo off
rem Abre el sitio QACLLES en el navegador usando un servidor local.
rem (Con doble clic en index.html no funciona: el navegador bloquea la lectura de los datos.)
cd /d "%~dp0"
start "" http://localhost:8000
python -m http.server 8000
