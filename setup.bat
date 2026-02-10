@echo off
echo ======================================
echo Sistema de Gestao de Veiculos (SGV)
echo ======================================
echo.

echo Instalando dependencias...
pip install -r requirements.txt

echo.
echo Criando banco de dados...
python -m app.seed

echo.
echo Iniciando servidor...
echo Acesse: http://localhost:8000
echo.
python start.py

pause
