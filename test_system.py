#!/usr/bin/env python3
"""
Script de teste do sistema SGV
"""
import requests
import json
import sys
from pathlib import Path

API_BASE = "http://localhost:8000"

def test_api_endpoint(endpoint, description):
    """Testa um endpoint da API"""
    try:
        response = requests.get(f"{API_BASE}{endpoint}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {description}")
            return True, data
        else:
            print(f"❌ {description} - Status: {response.status_code}")
            return False, None
    except requests.exceptions.RequestException as e:
        print(f"❌ {description} - Erro: {e}")
        return False, None

def test_database():
    """Testa se o banco de dados existe"""
    db_path = Path("data/sgv.db")
    if db_path.exists():
        print(f"✅ Banco de dados existe ({db_path.stat().st_size} bytes)")
        return True
    else:
        print("❌ Banco de dados não encontrado")
        return False

def test_frontend():
    """Testa se o frontend está acessível"""
    try:
        response = requests.get(API_BASE, timeout=5)
        if response.status_code == 200 and "SGV" in response.text:
            print("✅ Frontend acessível")
            return True
        else:
            print("❌ Frontend não acessível")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend erro: {e}")
        return False

def main():
    print("🧪 Testando Sistema de Gestão de Veículos (SGV)")
    print("=" * 50)
    
    # Teste do banco de dados
    db_ok = test_database()
    
    # Teste do frontend
    frontend_ok = test_frontend()
    
    # Testes da API
    print("\n📡 Testando endpoints da API:")
    
    api_tests = [
        ("/api/dashboard/kpis", "KPIs do Dashboard"),
        ("/api/veiculos", "Lista de veículos"),
        ("/api/geo/viaturas", "GeoJSON de viaturas"),
        ("/api/geo/batalhoes", "GeoJSON de batalhões"),
        ("/api/dashboard/vida_util_por_categoria", "Vida útil por categoria"),
        ("/api/dashboard/fipe_por_categoria", "FIPE por categoria"),
        ("/api/dashboard/top_rodados", "Top veículos rodados"),
        ("/api/recomendacoes", "Recomendações de descarte"),
        ("/api/municipios", "Lista de municípios"),
        ("/api/organizacoes", "Lista de organizações"),
    ]
    
    successful_tests = 0
    total_tests = len(api_tests)
    
    for endpoint, description in api_tests:
        success, data = test_api_endpoint(endpoint, description)
        if success:
            successful_tests += 1
            
            # Mostrar estatísticas básicas
            if endpoint == "/api/dashboard/kpis" and data:
                print(f"   📊 Frota total: {data.get('frota_total', 'N/A')}")
                print(f"   📊 % Ativos: {data.get('pct_ativos', 'N/A')}%")
                print(f"   📊 Vida útil média: {data.get('vida_util_media', 'N/A')}")
            elif endpoint == "/api/veiculos" and data:
                print(f"   🚗 Veículos encontrados: {len(data)}")
            elif endpoint == "/api/geo/viaturas" and data:
                print(f"   🗺️ Pontos GeoJSON: {len(data.get('features', []))}")
    
    print(f"\n📈 Resultados dos testes:")
    print(f"   Banco de dados: {'✅' if db_ok else '❌'}")
    print(f"   Frontend: {'✅' if frontend_ok else '❌'}")
    print(f"   API: {successful_tests}/{total_tests} endpoints funcionando")
    
    # Documentação da API
    try:
        docs_response = requests.get(f"{API_BASE}/docs", timeout=5)
        if docs_response.status_code == 200:
            print("   📚 Documentação da API: ✅")
        else:
            print("   📚 Documentação da API: ❌")
    except:
        print("   📚 Documentação da API: ❌")
    
    if successful_tests == total_tests and db_ok and frontend_ok:
        print("\n🎉 Todos os testes passaram! Sistema funcionando corretamente.")
        print(f"\n🌐 Acesse o sistema em: {API_BASE}")
        print(f"📖 Documentação da API: {API_BASE}/docs")
        return 0
    else:
        print("\n⚠️ Alguns testes falharam. Verifique se o servidor está rodando.")
        print("💡 Execute: python start.py")
        return 1

if __name__ == "__main__":
    sys.exit(main())
