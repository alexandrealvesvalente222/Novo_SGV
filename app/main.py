"""
FastAPI application principal do SGV
"""
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
import json

from app.db import get_db, create_tables
from app.models import Veiculo, Organizacao, Manutencao, UsoHoras, GeoBatalhoes, GeoBases, GeoViaturas
from app.schemas import (
    Veiculo as VeiculoSchema, VeiculoDetalhado, Organizacao as OrganizacaoSchema,
    NotaOcupacao, KPIs, VidaUtilCategoria, FipeCategoria, TopVeiculo, 
    Recomendacao, GeoJSONFeatureCollection
)
from app.services import (
    calcular_nota_ocupacao, get_kpis, get_vida_util_por_categoria,
    get_fipe_por_categoria, get_top_rodados, get_top_horas,
    get_top_manutencoes, get_recomendacoes_descarte,
    get_geo_batalhoes, get_geo_bases, get_geo_viaturas
)

# Criar tabelas no startup
create_tables()

# Inicializar FastAPI
app = FastAPI(
    title="Sistema de Gestão de Veículos (SGV)",
    description="API para gestão de frota de veículos com mapa interativo e dashboard",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Servir página principal"""
    try:
        with open("frontend/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Frontend não encontrado</h1><p>Execute o script de setup primeiro.</p>")

# ====== ENDPOINTS DE VEÍCULOS ======

@app.get("/api/veiculos", response_model=List[VeiculoSchema])
def listar_veiculos(
    comando: Optional[str] = Query(None),
    unidade: Optional[str] = Query(None),
    batalhao: Optional[str] = Query(None),
    viatura: Optional[str] = Query(None),
    municipio: Optional[str] = Query(None),
    bairro: Optional[str] = Query(None),
    ativo: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Listar veículos com filtros"""
    
    query = db.query(Veiculo).join(Organizacao)
    
    # Aplicar filtros conforme services.py
    if comando:
        comandos = db.query(Organizacao).filter(
            Organizacao.tipo == "Comando",
            Organizacao.nome.ilike(f"%{comando}%")
        ).all()
        if comandos:
            comando_ids = [c.id for c in comandos]
            from app.services import get_organizacao_filhos_ids
            filhos_ids = get_organizacao_filhos_ids(db, comando_ids)
            query = query.filter(Veiculo.organizacao_id.in_(filhos_ids))
    
    if unidade:
        unidades = db.query(Organizacao).filter(
            Organizacao.tipo == "Unidade",
            Organizacao.nome.ilike(f"%{unidade}%")
        ).all()
        if unidades:
            unidade_ids = [u.id for u in unidades]
            from app.services import get_organizacao_filhos_ids
            filhos_ids = get_organizacao_filhos_ids(db, unidade_ids)
            query = query.filter(Veiculo.organizacao_id.in_(filhos_ids))
    
    if batalhao:
        batalhoes = db.query(Organizacao).filter(
            Organizacao.tipo == "Batalhao",
            Organizacao.nome.ilike(f"%{batalhao}%")
        ).all()
        if batalhoes:
            batalhao_ids = [b.id for b in batalhoes]
            query = query.filter(Veiculo.organizacao_id.in_(batalhao_ids))
    
    if viatura:
        query = query.filter(
            (Veiculo.prefixo.ilike(f"%{viatura}%")) |
            (Veiculo.placa.ilike(f"%{viatura}%"))
        )
    
    if municipio:
        query = query.filter(Veiculo.municipio.ilike(f"%{municipio}%"))
    
    if bairro:
        query = query.filter(Veiculo.bairro.ilike(f"%{bairro}%"))
    
    if ativo is not None:
        query = query.filter(Veiculo.ativo == ativo)
    
    veiculos = query.all()
    
    # Adicionar nota de ocupação
    resultado = []
    for veiculo in veiculos:
        nota, faixa = calcular_nota_ocupacao(veiculo)
        veiculo_dict = VeiculoSchema.model_validate(veiculo).model_dump()
        veiculo_dict["nota_ocupacao"] = nota
        veiculo_dict["faixa_ocupacao"] = faixa
        resultado.append(veiculo_dict)
    
    return resultado

@app.get("/api/veiculos/{veiculo_id}", response_model=VeiculoDetalhado)
def obter_veiculo(veiculo_id: int, db: Session = Depends(get_db)):
    """Obter detalhes de um veículo"""
    
    veiculo = db.query(Veiculo).filter(Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    nota, faixa = calcular_nota_ocupacao(veiculo)
    
    veiculo_dict = VeiculoDetalhado.model_validate(veiculo).model_dump()
    veiculo_dict["nota_ocupacao"] = nota
    veiculo_dict["faixa_ocupacao"] = faixa
    
    return veiculo_dict

@app.get("/api/veiculos/{veiculo_id}/nota", response_model=NotaOcupacao)
def obter_nota_ocupacao(veiculo_id: int, db: Session = Depends(get_db)):
    """Obter nota de ocupação de um veículo"""
    
    veiculo = db.query(Veiculo).filter(Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    nota, faixa = calcular_nota_ocupacao(veiculo)
    
    return NotaOcupacao(nota=nota, faixa=faixa)

# ====== ENDPOINTS GEO ======

@app.get("/api/geo/batalhoes", response_model=GeoJSONFeatureCollection)
def obter_geo_batalhoes(
    municipio: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Obter polígonos dos batalhões"""
    return get_geo_batalhoes(db, municipio)

@app.get("/api/geo/bases", response_model=GeoJSONFeatureCollection)
def obter_geo_bases(
    municipio: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Obter pontos das bases"""
    return get_geo_bases(db, municipio)

@app.get("/api/geo/viaturas", response_model=GeoJSONFeatureCollection)
def obter_geo_viaturas(
    comando: Optional[str] = Query(None),
    unidade: Optional[str] = Query(None),
    batalhao: Optional[str] = Query(None),
    viatura: Optional[str] = Query(None),
    municipio: Optional[str] = Query(None),
    bairro: Optional[str] = Query(None),
    ativo: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Obter pontos das viaturas com filtros"""
    
    filtros = {
        "comando": comando,
        "unidade": unidade,
        "batalhao": batalhao,
        "viatura": viatura,
        "municipio": municipio,
        "bairro": bairro,
        "ativo": ativo
    }
    
    # Remover filtros None
    filtros = {k: v for k, v in filtros.items() if v is not None}
    
    return get_geo_viaturas(db, **filtros)

@app.post("/api/geo/upload")
def upload_geojson(
    tipo: str = Query(..., description="Tipo: batalhoes, bases, viaturas"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload de arquivo GeoJSON"""
    
    if not file.filename.endswith('.geojson'):
        raise HTTPException(status_code=400, detail="Arquivo deve ser .geojson")
    
    try:
        content = file.file.read()
        geojson_data = json.loads(content)
        
        # Validação básica
        if geojson_data.get("type") != "FeatureCollection":
            raise HTTPException(status_code=400, detail="GeoJSON deve ser FeatureCollection")
        
        # Implementação simplificada - apenas retorna sucesso
        # Em produção, processar e salvar cada feature
        
        return {"message": f"Upload de {tipo} realizado com sucesso", "features": len(geojson_data.get("features", []))}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Arquivo GeoJSON inválido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")

# ====== ENDPOINTS DASHBOARD ======

@app.get("/api/dashboard/kpis", response_model=KPIs)
def obter_kpis(db: Session = Depends(get_db)):
    """Obter KPIs principais do dashboard"""
    return get_kpis(db)

@app.get("/api/dashboard/vida_util_por_categoria", response_model=List[VidaUtilCategoria])
def obter_vida_util_por_categoria(db: Session = Depends(get_db)):
    """Obter vida útil média por categoria"""
    return get_vida_util_por_categoria(db)

@app.get("/api/dashboard/fipe_por_categoria", response_model=List[FipeCategoria])
def obter_fipe_por_categoria(db: Session = Depends(get_db)):
    """Obter valores FIPE por categoria"""
    return get_fipe_por_categoria(db)

@app.get("/api/dashboard/top_rodados", response_model=List[TopVeiculo])
def obter_top_rodados(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    """Obter veículos mais rodados"""
    return get_top_rodados(db, limit)

@app.get("/api/dashboard/top_horas", response_model=List[TopVeiculo])
def obter_top_horas(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    """Obter veículos com mais horas trabalhadas"""
    return get_top_horas(db, limit)

@app.get("/api/dashboard/top_manutencoes", response_model=List[TopVeiculo])
def obter_top_manutencoes(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    """Obter veículos com mais manutenções"""
    return get_top_manutencoes(db, limit)

@app.get("/api/recomendacoes", response_model=List[Recomendacao])
def obter_recomendacoes(db: Session = Depends(get_db)):
    """Obter recomendações de descarte"""
    return get_recomendacoes_descarte(db)

# ====== ENDPOINTS ORGANIZAÇÕES ======

@app.get("/api/organizacoes", response_model=List[OrganizacaoSchema])
def listar_organizacoes(
    tipo: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Listar organizações"""
    
    query = db.query(Organizacao)
    
    if tipo:
        query = query.filter(Organizacao.tipo == tipo)
    
    return query.all()

@app.get("/api/organizacoes/{org_id}/filhos", response_model=List[OrganizacaoSchema])
def listar_filhos_organizacao(org_id: int, db: Session = Depends(get_db)):
    """Listar organizações filhas"""
    
    return db.query(Organizacao).filter(Organizacao.pai_id == org_id).all()

# ====== ENDPOINTS ADMIN ======

@app.get("/api/admin/parametros")
def obter_parametros():
    """Obter parâmetros do sistema"""
    from app.services import KM_REFERENCIA_CATEGORIA, MNT_MAX_6M, AREA_FATOR, W_KM, W_MNT
    
    return {
        "km_referencia": KM_REFERENCIA_CATEGORIA,
        "mnt_max_6m": MNT_MAX_6M,
        "area_fator": AREA_FATOR,
        "w_km": W_KM,
        "w_mnt": W_MNT
    }

@app.put("/api/admin/parametros")
def atualizar_parametros():
    """Atualizar parâmetros do sistema (placeholder)"""
    raise HTTPException(status_code=501, detail="Funcionalidade em desenvolvimento")

# ====== ENDPOINTS UTILITÁRIOS ======

@app.get("/api/municipios")
def listar_municipios(db: Session = Depends(get_db)):
    """Listar municípios únicos"""
    
    municipios = db.query(Veiculo.municipio).distinct().all()
    return [m[0] for m in municipios if m[0]]

@app.get("/api/bairros")
def listar_bairros(municipio: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Listar bairros, opcionalmente filtrados por município"""
    
    query = db.query(Veiculo.bairro).distinct()
    
    if municipio:
        query = query.filter(Veiculo.municipio == municipio)
    
    bairros = query.all()
    return [b[0] for b in bairros if b[0]]

@app.get("/api/categorias")
def listar_categorias(db: Session = Depends(get_db)):
    """Listar categorias de veículos"""
    
    categorias = db.query(Veiculo.categoria).distinct().all()
    return [c[0] for c in categorias if c[0]]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
