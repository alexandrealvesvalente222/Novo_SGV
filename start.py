#!/usr/bin/env python3
"""
Script de inicialização do SGV
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        print("✅ Dependências verificadas")
        return True
    except ImportError as e:
        print(f"❌ Dependência faltando: {e}")
        print("Execute: pip install -r requirements.txt")
        return False

def create_database():
    """Cria e popula o banco de dados"""
    try:
        print("🗄️ Criando banco de dados...")
        from app.db import create_tables
        create_tables()
        print("✅ Banco de dados criado")
        
        print("🌱 Populando dados de exemplo...")
        from app.seed import create_seed_data
        create_seed_data()
        print("✅ Dados de exemplo criados")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao criar banco: {e}")
        return False

def start_server(host="0.0.0.0", port=8000, reload=True):
    """Inicia o servidor FastAPI"""
    try:
        print(f"🚀 Iniciando servidor em http://{host}:{port}")
        print("📊 Documentação da API: http://localhost:8000/docs")
        print("🗺️ Aplicação SGV: http://localhost:8000/")
        print("\nPressione Ctrl+C para parar o servidor")
        
        cmd = [
            sys.executable, "-m", "uvicorn", 
            "app.main:app",
            "--host", host,
            "--port", str(port)
        ]
        
        if reload:
            cmd.append("--reload")
            
        subprocess.run(cmd)
        
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado")
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")

def main():
    parser = argparse.ArgumentParser(description="Sistema de Gestão de Veículos (SGV)")
    parser.add_argument("--host", default="0.0.0.0", help="Host do servidor")
    parser.add_argument("--port", type=int, default=8000, help="Porta do servidor")
    parser.add_argument("--no-reload", action="store_true", help="Desabilitar reload automático")
    parser.add_argument("--skip-db", action="store_true", help="Pular criação do banco")
    parser.add_argument("--reset-db", action="store_true", help="Recriar banco do zero")
    
    args = parser.parse_args()
    
    print("🚓 Sistema de Gestão de Veículos (SGV)")
    print("=" * 50)
    
    # Verificar dependências
    if not check_dependencies():
        sys.exit(1)
    
    # Criar diretórios necessários
    os.makedirs("data", exist_ok=True)
    
    # Gerenciar banco de dados
    db_path = Path("data/sgv.db")
    
    if args.reset_db and db_path.exists():
        print("🗑️ Removendo banco existente...")
        db_path.unlink()
    
    if not args.skip_db and (not db_path.exists() or args.reset_db):
        if not create_database():
            sys.exit(1)
    elif db_path.exists():
        print("✅ Banco de dados existente encontrado")
    
    # Iniciar servidor
    start_server(
        host=args.host,
        port=args.port,
        reload=not args.no_reload
    )

if __name__ == "__main__":
    main()
