"""
Modelos SQLAlchemy para o SGV
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class Organizacao(Base):
    """Estrutura organizacional hierárquica"""
    __tablename__ = "organizacao"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)  # Comando, Unidade, Batalhao
    pai_id = Column(Integer, ForeignKey("organizacao.id"), nullable=True)
    
    # Relacionamentos
    pai = relationship("Organizacao", remote_side=[id], back_populates="filhos")
    filhos = relationship("Organizacao", back_populates="pai")
    veiculos = relationship("Veiculo", back_populates="organizacao")

class Veiculo(Base):
    """Veículo da frota"""
    __tablename__ = "veiculo"

    id = Column(Integer, primary_key=True, index=True)
    prefixo = Column(String(20), nullable=False, unique=True)
    placa = Column(String(10), nullable=False, unique=True)
    categoria = Column(String(30), nullable=False)  # Caminhonete, SUV, Moto, Van, etc.
    organizacao_id = Column(Integer, ForeignKey("organizacao.id"), nullable=False)
    municipio = Column(String(50), nullable=False)
    bairro = Column(String(50), nullable=False)
    area_atuacao = Column(String(20), nullable=False)  # Urbana, Rural, Mista
    ativo = Column(Boolean, default=True)
    odometro_km = Column(Integer, default=0)
    horas_mes = Column(Integer, default=0)
    manutencoes_6m = Column(Integer, default=0)
    valor_fipe = Column(Float, default=0.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relacionamentos
    organizacao = relationship("Organizacao", back_populates="veiculos")
    manutencoes = relationship("Manutencao", back_populates="veiculo")
    uso_horas = relationship("UsoHoras", back_populates="veiculo")

class Manutencao(Base):
    """Histórico de manutenções"""
    __tablename__ = "manutencao"

    id = Column(Integer, primary_key=True, index=True)
    veiculo_id = Column(Integer, ForeignKey("veiculo.id"), nullable=False)
    data = Column(DateTime, nullable=False)
    tipo = Column(String(50), nullable=False)
    custo = Column(Float, default=0.0)
    descricao = Column(Text, nullable=True)
    
    # Relacionamentos
    veiculo = relationship("Veiculo", back_populates="manutencoes")

class UsoHoras(Base):
    """Controle de horas mensais"""
    __tablename__ = "uso_horas"

    id = Column(Integer, primary_key=True, index=True)
    veiculo_id = Column(Integer, ForeignKey("veiculo.id"), nullable=False)
    ano_mes = Column(String(7), nullable=False)  # YYYY-MM
    horas = Column(Integer, default=0)
    
    # Relacionamentos
    veiculo = relationship("Veiculo", back_populates="uso_horas")

class GeoBatalhoes(Base):
    """Polígonos dos batalhões por município"""
    __tablename__ = "geo_batalhoes"

    id = Column(Integer, primary_key=True, index=True)
    municipio = Column(String(50), nullable=False)
    batalhao_nome = Column(String(100), nullable=False)
    geojson = Column(JSON, nullable=False)

class GeoBases(Base):
    """Pontos das bases/batalhões"""
    __tablename__ = "geo_bases"

    id = Column(Integer, primary_key=True, index=True)
    batalhao_nome = Column(String(100), nullable=False)
    municipio = Column(String(50), nullable=False)
    geojson = Column(JSON, nullable=False)

class GeoViaturas(Base):
    """Pontos das viaturas (sincronizado com veiculo)"""
    __tablename__ = "geo_viaturas"

    id = Column(Integer, primary_key=True, index=True)
    veiculo_id = Column(Integer, ForeignKey("veiculo.id"), nullable=False)
    geojson = Column(JSON, nullable=False)
    
    # Relacionamentos
    veiculo = relationship("Veiculo")
