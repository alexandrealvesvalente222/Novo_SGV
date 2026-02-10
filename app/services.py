"""
Regras de negócio e serviços do SGV
"""
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import Veiculo, Organizacao, Manutencao, UsoHoras, GeoBatalhoes, GeoBases, GeoViaturas
from app.schemas import (
    KPIs, VidaUtilCategoria, FipeCategoria, TopVeiculo, 
    Recomendacao, NotaOcupacao, GeoJSONFeatureCollection
)

# Parâmetros do cálculo da Nota de Ocupação
KM_REFERENCIA_CATEGORIA = {
    "Moto": 120_000,
    "SUV": 300_000,
    "Caminhonete": 300_000,
    "Van": 350_000,
    "Sedan": 220_000,
    "Hatch": 220_000,
    "Pickup": 300_000,
    "Utilitario": 250_000
}

MNT_MAX_6M = 6
AREA_FATOR = {
    "Urbana": 1.00,
    "Rural": 1.05,
    "Mista": 1.03,
    "Montanhosa": 1.10,
    "Off-road": 1.10
}

W_KM = 0.6  # Peso da quilometragem
W_MNT = 0.4  # Peso das manutenções

def calcular_nota_ocupacao(veiculo: Veiculo) -> Tuple[int, str]:
    """
    Calcula a Nota de Ocupação (0-100) e retorna a faixa
    
    Args:
        veiculo: Instância do veículo
        
    Returns:
        Tuple[int, str]: (nota, faixa)
    """
    # Normalização da quilometragem
    km_ref = KM_REFERENCIA_CATEGORIA.get(veiculo.categoria, 250_000)
    km_norm = min(veiculo.odometro_km / km_ref, 1.0)
    
    # Normalização das manutenções
    mnt_norm = min(veiculo.manutencoes_6m / MNT_MAX_6M, 1.0)
    
    # Fator da área de atuação
    area_fator = AREA_FATOR.get(veiculo.area_atuacao, 1.0)
    
    # Cálculo do desgaste
    desgaste = (W_KM * km_norm + W_MNT * mnt_norm) * area_fator
    
    # Nota final (0-100)
    nota = round(max(0, min(100, 100 * (1 - desgaste))))
    
    # Determinação da faixa
    if nota < 60:
        faixa = "Crítico"
    elif nota < 80:
        faixa = "Atenção"
    else:
        faixa = "Adequado"
    
    return nota, faixa

def get_kpis(db: Session) -> KPIs:
    """Calcula os KPIs principais do dashboard"""
    
    # Frota total
    frota_total = db.query(Veiculo).count()
    
    # Percentual de ativos
    ativos = db.query(Veiculo).filter(Veiculo.ativo == True).count()
    pct_ativos = (ativos / frota_total * 100) if frota_total > 0 else 0
    
    # Vida útil média (nota de ocupação)
    veiculos = db.query(Veiculo).all()
    if veiculos:
        notas = [calcular_nota_ocupacao(v)[0] for v in veiculos]
        vida_util_media = sum(notas) / len(notas)
    else:
        vida_util_media = 0
    
    # Total de horas no mês
    horas_mes_total = db.query(func.sum(Veiculo.horas_mes)).scalar() or 0
    
    return KPIs(
        frota_total=frota_total,
        pct_ativos=round(pct_ativos, 1),
        vida_util_media=round(vida_util_media, 1),
        horas_mes_total=horas_mes_total
    )

def get_vida_util_por_categoria(db: Session) -> List[VidaUtilCategoria]:
    """Calcula vida útil média por categoria com informações detalhadas"""
    
    categorias = db.query(Veiculo.categoria).distinct().all()
    resultado = []
    
    for (categoria,) in categorias:
        veiculos = db.query(Veiculo).filter(Veiculo.categoria == categoria).all()
        
        if veiculos:
            # Calcular notas de ocupação e estatísticas básicas
            notas_e_faixas = [calcular_nota_ocupacao(v) for v in veiculos]
            notas = [nota for nota, _ in notas_e_faixas]
            faixas = [faixa for _, faixa in notas_e_faixas]
            
            # Estatísticas gerais
            total_veiculos = len(veiculos)
            veiculos_ativos = sum(1 for v in veiculos if v.ativo)
            nota_media = sum(notas) / len(notas)
            
            # Contagem por faixa de vida útil
            veiculos_criticos = sum(1 for faixa in faixas if faixa == "Crítico")
            veiculos_atencao = sum(1 for faixa in faixas if faixa == "Atenção")
            veiculos_adequados = sum(1 for faixa in faixas if faixa == "Adequado")
            
            # Médias de uso
            km_media = sum(v.odometro_km for v in veiculos) / total_veiculos
            horas_mes_media = sum(v.horas_mes for v in veiculos) / total_veiculos
            manutencoes_6m_media = sum(v.manutencoes_6m for v in veiculos) / total_veiculos
            
            resultado.append(VidaUtilCategoria(
                categoria=categoria,
                nota_media=round(nota_media, 1),
                total_veiculos=total_veiculos,
                veiculos_ativos=veiculos_ativos,
                veiculos_criticos=veiculos_criticos,
                veiculos_atencao=veiculos_atencao,
                veiculos_adequados=veiculos_adequados,
                km_media=round(km_media, 0),
                horas_mes_media=round(horas_mes_media, 1),
                manutencoes_6m_media=round(manutencoes_6m_media, 1)
            ))
    
    return sorted(resultado, key=lambda x: x.nota_media, reverse=True)

def get_fipe_por_categoria(db: Session) -> List[FipeCategoria]:
    """Calcula valores FIPE por categoria"""
    
    resultado = db.query(
        Veiculo.categoria,
        func.avg(Veiculo.valor_fipe).label('valor_medio'),
        func.sum(Veiculo.valor_fipe).label('valor_total')
    ).group_by(Veiculo.categoria).all()
    
    return [
        FipeCategoria(
            categoria=categoria,
            valor_fipe_medio=round(valor_medio, 2),
            valor_fipe_total=round(valor_total, 2)
        )
        for categoria, valor_medio, valor_total in resultado
    ]

def get_top_rodados(db: Session, limit: int = 10) -> List[TopVeiculo]:
    """Top veículos mais rodados"""
    
    veiculos = db.query(Veiculo).join(Organizacao)\
        .order_by(desc(Veiculo.odometro_km))\
        .limit(limit).all()
    
    return [
        TopVeiculo(
            id=v.id,
            prefixo=v.prefixo,
            placa=v.placa,
            categoria=v.categoria,
            organizacao_nome=v.organizacao.nome,
            valor=v.odometro_km
        )
        for v in veiculos
    ]

def get_top_horas(db: Session, limit: int = 10) -> List[TopVeiculo]:
    """Top veículos com mais horas no mês"""
    
    veiculos = db.query(Veiculo).join(Organizacao)\
        .order_by(desc(Veiculo.horas_mes))\
        .limit(limit).all()
    
    return [
        TopVeiculo(
            id=v.id,
            prefixo=v.prefixo,
            placa=v.placa,
            categoria=v.categoria,
            organizacao_nome=v.organizacao.nome,
            valor=v.horas_mes
        )
        for v in veiculos
    ]

def get_top_manutencoes(db: Session, limit: int = 10) -> List[TopVeiculo]:
    """Top veículos com mais manutenções nos últimos 6 meses"""
    
    veiculos = db.query(Veiculo).join(Organizacao)\
        .order_by(desc(Veiculo.manutencoes_6m))\
        .limit(limit).all()
    
    return [
        TopVeiculo(
            id=v.id,
            prefixo=v.prefixo,
            placa=v.placa,
            categoria=v.categoria,
            organizacao_nome=v.organizacao.nome,
            valor=v.manutencoes_6m
        )
        for v in veiculos
    ]

def get_recomendacoes_descarte(db: Session) -> List[Recomendacao]:
    """Gera recomendações de descarte baseadas nas regras"""
    
    veiculos = db.query(Veiculo).join(Organizacao).all()
    recomendacoes = []
    
    for veiculo in veiculos:
        nota, faixa = calcular_nota_ocupacao(veiculo)
        motivos = []
        
        # Regra 1: Nota baixa
        if nota < 50:
            motivos.append(f"Nota de ocupação crítica ({nota})")
        
        # Regra 2: Muitas manutenções
        if veiculo.manutencoes_6m >= 5:
            motivos.append(f"Excesso de manutenções ({veiculo.manutencoes_6m} em 6 meses)")
        
        # Regra 3: Alta quilometragem
        km_ref = KM_REFERENCIA_CATEGORIA.get(veiculo.categoria, 250_000)
        if veiculo.odometro_km >= 0.9 * km_ref:
            pct_km = (veiculo.odometro_km / km_ref) * 100
            motivos.append(f"Alta quilometragem ({pct_km:.1f}% da vida útil)")
        
        if motivos:
            # Estimar economia (simplificado)
            custo_manutencao_anual = veiculo.manutencoes_6m * 2 * 2000  # R$ 2.000 por manutenção
            economia = min(custo_manutencao_anual, veiculo.valor_fipe * 0.3)
            
            recomendacoes.append(Recomendacao(
                veiculo_id=veiculo.id,
                prefixo=veiculo.prefixo,
                placa=veiculo.placa,
                categoria=veiculo.categoria,
                organizacao_nome=veiculo.organizacao.nome,
                motivo="; ".join(motivos),
                impacto=f"Economia estimada: R$ {economia:,.2f}/ano",
                nota_ocupacao=nota
            ))
    
    # Ordenar por prioridade (nota mais baixa primeiro)
    return sorted(recomendacoes, key=lambda x: x.nota_ocupacao)

def get_geo_batalhoes(db: Session, municipio: Optional[str] = None) -> GeoJSONFeatureCollection:
    """Retorna polígonos dos batalhões como GeoJSON"""
    
    query = db.query(GeoBatalhoes)
    if municipio:
        query = query.filter(GeoBatalhoes.municipio == municipio)
    
    batalhoes = query.all()
    features = []
    
    for batalhao in batalhoes:
        feature = {
            "type": "Feature",
            "geometry": batalhao.geojson["geometry"],
            "properties": {
                **batalhao.geojson.get("properties", {}),
                "municipio": batalhao.municipio,
                "batalhao_nome": batalhao.batalhao_nome
            }
        }
        features.append(feature)
    
    return GeoJSONFeatureCollection(features=features)

def get_geo_bases(db: Session, municipio: Optional[str] = None) -> GeoJSONFeatureCollection:
    """Retorna pontos das bases como GeoJSON"""
    
    query = db.query(GeoBases)
    if municipio:
        query = query.filter(GeoBases.municipio == municipio)
    
    bases = query.all()
    features = []
    
    for base in bases:
        feature = {
            "type": "Feature",
            "geometry": base.geojson["geometry"],
            "properties": {
                **base.geojson.get("properties", {}),
                "municipio": base.municipio,
                "batalhao_nome": base.batalhao_nome
            }
        }
        features.append(feature)
    
    return GeoJSONFeatureCollection(features=features)

def get_geo_viaturas(db: Session, **filtros) -> GeoJSONFeatureCollection:
    """Retorna pontos das viaturas como GeoJSON com filtros"""
    
    query = db.query(Veiculo).join(Organizacao)
    
    # Aplicar filtros
    if filtros.get("comando"):
        # Buscar comandos
        comandos = db.query(Organizacao).filter(
            Organizacao.tipo == "Comando",
            Organizacao.nome.ilike(f"%{filtros['comando']}%")
        ).all()
        if comandos:
            comando_ids = [c.id for c in comandos]
            # Buscar todas as organizações filhas
            filhos_ids = get_organizacao_filhos_ids(db, comando_ids)
            query = query.filter(Veiculo.organizacao_id.in_(filhos_ids))
    
    if filtros.get("unidade"):
        unidades = db.query(Organizacao).filter(
            Organizacao.tipo == "Unidade",
            Organizacao.nome.ilike(f"%{filtros['unidade']}%")
        ).all()
        if unidades:
            unidade_ids = [u.id for u in unidades]
            filhos_ids = get_organizacao_filhos_ids(db, unidade_ids)
            query = query.filter(Veiculo.organizacao_id.in_(filhos_ids))
    
    if filtros.get("batalhao"):
        batalhoes = db.query(Organizacao).filter(
            Organizacao.tipo == "Batalhao",
            Organizacao.nome.ilike(f"%{filtros['batalhao']}%")
        ).all()
        if batalhoes:
            batalhao_ids = [b.id for b in batalhoes]
            query = query.filter(Veiculo.organizacao_id.in_(batalhao_ids))
    
    if filtros.get("viatura"):
        query = query.filter(
            (Veiculo.prefixo.ilike(f"%{filtros['viatura']}%")) |
            (Veiculo.placa.ilike(f"%{filtros['viatura']}%"))
        )
    
    if filtros.get("municipio"):
        query = query.filter(Veiculo.municipio.ilike(f"%{filtros['municipio']}%"))
    
    if filtros.get("bairro"):
        query = query.filter(Veiculo.bairro.ilike(f"%{filtros['bairro']}%"))
    
    if filtros.get("ativo") is not None:
        query = query.filter(Veiculo.ativo == filtros["ativo"])
    
    veiculos = query.all()
    features = []
    
    for veiculo in veiculos:
        if veiculo.latitude and veiculo.longitude:
            nota, faixa = calcular_nota_ocupacao(veiculo)
            
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [veiculo.longitude, veiculo.latitude]
                },
                "properties": {
                    "veiculo_id": veiculo.id,
                    "prefixo": veiculo.prefixo,
                    "placa": veiculo.placa,
                    "categoria": veiculo.categoria,
                    "organizacao": veiculo.organizacao.nome,
                    "municipio": veiculo.municipio,
                    "bairro": veiculo.bairro,
                    "area_atuacao": veiculo.area_atuacao,
                    "odometro_km": veiculo.odometro_km,
                    "horas_mes": veiculo.horas_mes,
                    "manutencoes_6m": veiculo.manutencoes_6m,
                    "nota_ocupacao": nota,
                    "faixa_ocupacao": faixa,
                    "ativo": veiculo.ativo
                }
            }
            features.append(feature)
    
    return GeoJSONFeatureCollection(features=features)

def get_organizacao_filhos_ids(db: Session, pais_ids: List[int]) -> List[int]:
    """Retorna todos os IDs de organizações filhas (recursivo)"""
    
    todos_ids = set(pais_ids)
    
    def buscar_filhos(ids_atuais):
        filhos = db.query(Organizacao.id).filter(Organizacao.pai_id.in_(ids_atuais)).all()
        filhos_ids = [f[0] for f in filhos]
        
        if filhos_ids:
            todos_ids.update(filhos_ids)
            buscar_filhos(filhos_ids)
    
    buscar_filhos(pais_ids)
    return list(todos_ids)
