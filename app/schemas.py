"""
Schemas Pydantic para validação de dados
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# Base schemas
class OrganizacaoBase(BaseModel):
    nome: str
    tipo: str
    pai_id: Optional[int] = None

class OrganizacaoCreate(OrganizacaoBase):
    pass

class Organizacao(OrganizacaoBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    filhos: List['Organizacao'] = []

class VeiculoBase(BaseModel):
    prefixo: str
    placa: str
    categoria: str
    organizacao_id: int
    municipio: str
    bairro: str
    area_atuacao: str
    ativo: bool = True
    odometro_km: int = 0
    horas_mes: int = 0
    manutencoes_6m: int = 0
    valor_fipe: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class VeiculoCreate(VeiculoBase):
    pass

class Veiculo(VeiculoBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    organizacao: Organizacao
    nota_ocupacao: Optional[int] = None
    faixa_ocupacao: Optional[str] = None

class ManutencaoBase(BaseModel):
    veiculo_id: int
    data: datetime
    tipo: str
    custo: float = 0.0
    descricao: Optional[str] = None

class ManutencaoCreate(ManutencaoBase):
    pass

class Manutencao(ManutencaoBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int

class UsoHorasBase(BaseModel):
    veiculo_id: int
    ano_mes: str
    horas: int = 0

class UsoHorasCreate(UsoHorasBase):
    pass

class UsoHoras(UsoHorasBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int

# GeoJSON schemas
class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class GeoBatalhoesCreate(BaseModel):
    municipio: str
    batalhao_nome: str
    geojson: Dict[str, Any]

class GeoBasesCreate(BaseModel):
    batalhao_nome: str
    municipio: str
    geojson: Dict[str, Any]

class GeoViaturasCreate(BaseModel):
    veiculo_id: int
    geojson: Dict[str, Any]

# Dashboard schemas
class KPIs(BaseModel):
    frota_total: int
    pct_ativos: float
    vida_util_media: float
    horas_mes_total: int

class VidaUtilCategoria(BaseModel):
    categoria: str
    nota_media: float
    total_veiculos: int
    veiculos_ativos: int
    veiculos_criticos: int  # Nota < 60
    veiculos_atencao: int   # Nota 60-79
    veiculos_adequados: int # Nota >= 80
    km_media: float
    horas_mes_media: float
    manutencoes_6m_media: float

class FipeCategoria(BaseModel):
    categoria: str
    valor_fipe_medio: float
    valor_fipe_total: float

class TopVeiculo(BaseModel):
    id: int
    prefixo: str
    placa: str
    categoria: str
    organizacao_nome: str
    valor: int  # odometro_km, horas_mes ou manutencoes_6m

class Recomendacao(BaseModel):
    veiculo_id: int
    prefixo: str
    placa: str
    categoria: str
    organizacao_nome: str
    motivo: str
    impacto: str
    nota_ocupacao: int

class NotaOcupacao(BaseModel):
    nota: int
    faixa: str  # Crítico, Atenção, Adequado

# Response schemas
class VeiculoDetalhado(Veiculo):
    manutencoes: List[Manutencao] = []
    uso_horas: List[UsoHoras] = []

# Parâmetros do sistema
class ParametrosSistema(BaseModel):
    km_referencia: Dict[str, int]
    mnt_max_6m: int
    area_fator: Dict[str, float]
    w_km: float
    w_mnt: float
