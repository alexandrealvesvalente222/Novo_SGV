#!/bin/bash

echo "======================================"
echo "Sistema de Gestão de Veículos (SGV)"
echo "======================================"
echo

echo "Instalando dependências..."
pip install -r requirements.txt

echo
echo "Criando banco de dados..."
python -m app.seed

echo
echo "Iniciando servidor..."
echo "Acesse: http://localhost:8000"
echo
python start.py
