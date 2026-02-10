"""
Script para popular o banco de dados com dados de exemplo
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db import engine, SessionLocal, create_tables
from app.models import (
    Organizacao, Veiculo, Manutencao, UsoHoras, 
    GeoBatalhoes, GeoBases, GeoViaturas
)

def create_seed_data():
    """Criar dados de exemplo no banco"""
    
    # Criar tabelas
    create_tables()
    
    db = SessionLocal()
    
    try:
        # Limpar dados existentes
        db.query(GeoViaturas).delete()
        db.query(GeoBases).delete()
        db.query(GeoBatalhoes).delete()
        db.query(UsoHoras).delete()
        db.query(Manutencao).delete()
        db.query(Veiculo).delete()
        db.query(Organizacao).delete()
        db.commit()
        
        # ====== ESTRUTURA ORGANIZACIONAL ======
        print("Criando estrutura organizacional...")
        
        # Comandos
        cmd_metropolitano = Organizacao(nome="Comando Metropolitano", tipo="Comando")
        cmd_interior = Organizacao(nome="Comando do Interior", tipo="Comando")
        cmd_especial = Organizacao(nome="Comando de Operações Especiais", tipo="Comando")
        
        db.add_all([cmd_metropolitano, cmd_interior, cmd_especial])
        db.commit()
        
        # Unidades
        unidades = [
            # Comando Metropolitano
            Organizacao(nome="1ª Unidade Regional", tipo="Unidade", pai_id=cmd_metropolitano.id),
            Organizacao(nome="2ª Unidade Regional", tipo="Unidade", pai_id=cmd_metropolitano.id),
            # Comando Interior
            Organizacao(nome="3ª Unidade Regional", tipo="Unidade", pai_id=cmd_interior.id),
            Organizacao(nome="4ª Unidade Regional", tipo="Unidade", pai_id=cmd_interior.id),
            # Comando Especial
            Organizacao(nome="Unidade de Operações Especiais", tipo="Unidade", pai_id=cmd_especial.id),
            Organizacao(nome="Unidade de Trânsito", tipo="Unidade", pai_id=cmd_especial.id),
        ]
        
        db.add_all(unidades)
        db.commit()
        
        # Batalhões
        batalhoes = [
            # 1ª Unidade
            Organizacao(nome="1º Batalhão Central", tipo="Batalhao", pai_id=unidades[0].id),
            Organizacao(nome="2º Batalhão Norte", tipo="Batalhao", pai_id=unidades[0].id),
            # 2ª Unidade
            Organizacao(nome="3º Batalhão Sul", tipo="Batalhao", pai_id=unidades[1].id),
            Organizacao(nome="4º Batalhão Leste", tipo="Batalhao", pai_id=unidades[1].id),
            # 3ª Unidade
            Organizacao(nome="5º Batalhão Oeste", tipo="Batalhao", pai_id=unidades[2].id),
            Organizacao(nome="6º Batalhão Rural", tipo="Batalhao", pai_id=unidades[2].id),
            # 4ª Unidade
            Organizacao(nome="7º Batalhão Montanha", tipo="Batalhao", pai_id=unidades[3].id),
            # Unidades Especiais
            Organizacao(nome="Batalhão de Operações Especiais", tipo="Batalhao", pai_id=unidades[4].id),
            Organizacao(nome="Batalhão de Trânsito", tipo="Batalhao", pai_id=unidades[5].id),
        ]
        
        db.add_all(batalhoes)
        db.commit()
        
        # ====== VEÍCULOS ======
        print("Criando veículos...")
        
        municipios_bairros = {
            "São Paulo": ["Centro", "Vila Madalena", "Moema", "Liberdade"],
            "Campinas": ["Cambuí", "Centro", "Barão Geraldo"],
            "Santos": ["Centro", "Gonzaga", "Boqueirão", "Aparecida"]
        }
        
        categorias_km_ref = {
            "Moto": (50000, 120000),
            "SUV": (100000, 280000),
            "Caminhonete": (80000, 250000),
            "Van": (120000, 300000),
            "Sedan": (60000, 200000),
            "Hatch": (40000, 180000),
            "Pickup": (90000, 270000)
        }
        
        areas_atuacao = ["Urbana", "Rural", "Mista"]
        
        veiculos = []
        
        # Coordenadas de exemplo (região de SP)
        coordenadas_base = [
            (-23.550520, -46.633308),  # Centro SP
            (-23.561684, -46.656139),  # Vila Madalena
            (-23.595200, -46.656139),  # Moema
            (-23.543000, -46.629000),  # Liberdade
            (-22.907104, -47.063240),  # Campinas Centro
            (-22.900000, -47.100000),  # Cambuí
            (-22.870000, -47.120000),  # Barão Geraldo
            (-23.960833, -46.333889),  # Santos Centro
            (-23.966000, -46.335000),  # Gonzaga
        ]
        
        for i in range(25):
            categoria = random.choice(list(categorias_km_ref.keys()))
            municipio = random.choice(list(municipios_bairros.keys()))
            bairro = random.choice(municipios_bairros[municipio])
            batalhao = random.choice(batalhoes)
            
            # Gerar odômetro baseado na categoria
            km_min, km_max = categorias_km_ref[categoria]
            odometro = random.randint(km_min // 4, km_max)
            
            # Coordenadas aleatórias próximas aos pontos base
            lat_base, lng_base = random.choice(coordenadas_base)
            lat = lat_base + random.uniform(-0.05, 0.05)
            lng = lng_base + random.uniform(-0.05, 0.05)
            
            veiculo = Veiculo(
                prefixo=f"PM-{i+1:03d}",
                placa=f"ABC{i+1000}",
                categoria=categoria,
                organizacao_id=batalhao.id,
                municipio=municipio,
                bairro=bairro,
                area_atuacao=random.choice(areas_atuacao),
                ativo=random.choice([True, True, True, False]),  # 75% ativos
                odometro_km=odometro,
                horas_mes=random.randint(80, 200),
                manutencoes_6m=random.randint(0, 8),
                valor_fipe=random.uniform(30000, 150000),
                latitude=lat,
                longitude=lng
            )
            
            veiculos.append(veiculo)
        
        db.add_all(veiculos)
        db.commit()
        
        # ====== MANUTENÇÕES ======
        print("Criando histórico de manutenções...")
        
        tipos_manutencao = [
            "Troca de óleo", "Revisão geral", "Troca de pneus", "Reparo freios",
            "Manutenção ar condicionado", "Troca filtros", "Alinhamento",
            "Reparo suspensão", "Manutenção elétrica", "Pintura"
        ]
        
        manutencoes = []
        for veiculo in veiculos:
            # Criar histórico de manutenções baseado no campo manutencoes_6m
            num_manutencoes = max(1, veiculo.manutencoes_6m + random.randint(-2, 3))
            
            for j in range(num_manutencoes):
                data_manutencao = datetime.now() - timedelta(days=random.randint(1, 365))
                
                manutencao = Manutencao(
                    veiculo_id=veiculo.id,
                    data=data_manutencao,
                    tipo=random.choice(tipos_manutencao),
                    custo=random.uniform(200, 5000),
                    descricao=f"Manutenção {random.choice(['preventiva', 'corretiva'])} realizada"
                )
                manutencoes.append(manutencao)
        
        db.add_all(manutencoes)
        db.commit()
        
        # ====== USO DE HORAS ======
        print("Criando histórico de uso de horas...")
        
        uso_horas = []
        for veiculo in veiculos:
            # Criar histórico dos últimos 12 meses
            for mes_offset in range(12):
                data_ref = datetime.now() - timedelta(days=30 * mes_offset)
                ano_mes = data_ref.strftime("%Y-%m")
                
                # Variar as horas com tendência baseada no mês atual
                if mes_offset == 0:
                    horas = veiculo.horas_mes
                else:
                    horas = max(0, veiculo.horas_mes + random.randint(-30, 30))
                
                uso = UsoHoras(
                    veiculo_id=veiculo.id,
                    ano_mes=ano_mes,
                    horas=horas
                )
                uso_horas.append(uso)
        
        db.add_all(uso_horas)
        db.commit()
        
        # ====== DADOS GEOJSON ======
        print("Criando dados GeoJSON...")
        
        # Batalhões (polígonos)
        batalhoes_geojson = [
            {
                "municipio": "São Paulo",
                "batalhao_nome": "1º Batalhão Central",
                "geojson": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-46.650, -23.540], [-46.620, -23.540],
                            [-46.620, -23.570], [-46.650, -23.570], [-46.650, -23.540]
                        ]]
                    },
                    "properties": {"nome": "1º Batalhão Central"}
                }
            },
            {
                "municipio": "São Paulo",
                "batalhao_nome": "2º Batalhão Norte",
                "geojson": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-46.650, -23.510], [-46.620, -23.510],
                            [-46.620, -23.540], [-46.650, -23.540], [-46.650, -23.510]
                        ]]
                    },
                    "properties": {"nome": "2º Batalhão Norte"}
                }
            },
            {
                "municipio": "Campinas",
                "batalhao_nome": "5º Batalhão Oeste",
                "geojson": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-47.100, -22.880], [-47.050, -22.880],
                            [-47.050, -22.920], [-47.100, -22.920], [-47.100, -22.880]
                        ]]
                    },
                    "properties": {"nome": "5º Batalhão Oeste"}
                }
            },
            {
                "municipio": "Santos",
                "batalhao_nome": "3º Batalhão Sul",
                "geojson": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-46.350, -23.950], [-46.320, -23.950],
                            [-46.320, -23.980], [-46.350, -23.980], [-46.350, -23.950]
                        ]]
                    },
                    "properties": {"nome": "3º Batalhão Sul"}
                }
            }
        ]
        
        for item in batalhoes_geojson:
            batalhao_geo = GeoBatalhoes(
                municipio=item["municipio"],
                batalhao_nome=item["batalhao_nome"],
                geojson=item["geojson"]
            )
            db.add(batalhao_geo)
        
        # Bases (pontos)
        bases_geojson = [
            {
                "batalhao_nome": "1º Batalhão Central",
                "municipio": "São Paulo",
                "geojson": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-46.635, -23.555]
                    },
                    "properties": {"nome": "Base Central"}
                }
            },
            {
                "batalhao_nome": "2º Batalhão Norte",
                "municipio": "São Paulo",
                "geojson": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-46.635, -23.525]
                    },
                    "properties": {"nome": "Base Norte"}
                }
            },
            {
                "batalhao_nome": "5º Batalhão Oeste",
                "municipio": "Campinas",
                "geojson": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-47.075, -22.900]
                    },
                    "properties": {"nome": "Base Oeste"}
                }
            },
            {
                "batalhao_nome": "3º Batalhão Sul",
                "municipio": "Santos",
                "geojson": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-46.335, -23.965]
                    },
                    "properties": {"nome": "Base Sul"}
                }
            }
        ]
        
        for item in bases_geojson:
            base_geo = GeoBases(
                batalhao_nome=item["batalhao_nome"],
                municipio=item["municipio"],
                geojson=item["geojson"]
            )
            db.add(base_geo)
        
        # Viaturas (sincronizar com veículos)
        for veiculo in veiculos:
            if veiculo.latitude and veiculo.longitude:
                viatura_geo = GeoViaturas(
                    veiculo_id=veiculo.id,
                    geojson={
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [veiculo.longitude, veiculo.latitude]
                        },
                        "properties": {
                            "veiculo_id": veiculo.id,
                            "prefixo": veiculo.prefixo,
                            "categoria": veiculo.categoria
                        }
                    }
                )
                db.add(viatura_geo)
        
        db.commit()
        
        print(f"✅ Seed concluído com sucesso!")
        print(f"   - {len(batalhoes)} batalhões criados")
        print(f"   - {len(veiculos)} veículos criados")
        print(f"   - {len(manutencoes)} manutenções criadas")
        print(f"   - {len(uso_horas)} registros de uso criados")
        print(f"   - Dados GeoJSON criados")
        
    except Exception as e:
        print(f"❌ Erro durante o seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_seed_data()
