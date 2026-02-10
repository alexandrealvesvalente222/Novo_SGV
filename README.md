# Sistema de Gestão de Veículos (SGV)

Sistema completo para gestão de frota de veículos com backend FastAPI e frontend HTML/CSS/JS.

## Funcionalidades

- **SIGWEB**: Mapa interativo com filtros organizacionais e geográficos
- **Dashboard**: Métricas e indicadores da frota com gráficos
- **Administrador**: Área administrativa (funcionalidades futuras)

## Tecnologias

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, SQLite
- **Frontend**: HTML, CSS, JavaScript (vanilla), Leaflet, Chart.js
- **Mapas**: Leaflet com camadas GeoJSON
- **Gráficos**: Chart.js

## Instalação e Execução

### Método 1: Script Automático (Recomendado)

**Windows:**
```cmd
setup.bat
```

**Linux/Mac:**
```bash
./setup.sh
```

### Método 2: Manual

1. **Instalar dependências**:
```bash
pip install -r requirements.txt
```

2. **Inicializar sistema**:
```bash
python start.py
```

### Método 3: Passo a Passo

1. **Instalar dependências**:
```bash
pip install -r requirements.txt
```

2. **Executar seed para popular banco**:
```bash
python -m app.seed
```

3. **Executar servidor**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Acesso à Aplicação

- **Frontend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Opções do Script de Inicialização

```bash
python start.py --help
```

Opções disponíveis:
- `--host HOST`: Endereço do servidor (padrão: 0.0.0.0)
- `--port PORT`: Porta do servidor (padrão: 8000)
- `--no-reload`: Desabilitar reload automático
- `--skip-db`: Pular criação do banco
- `--reset-db`: Recriar banco do zero

## Estrutura do Projeto

```
Novo_SGV/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── services.py
│   ├── db.py
│   └── seed.py
├── data/
│   └── sgv.db (criado automaticamente)
├── frontend/
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css
│   │   └── js/
│   │       ├── api.js
│   │       ├── map.js
│   │       ├── dashboard.js
│   │       └── utils.js
├── requirements.txt
└── README.md
```

## Funcionalidades Principais

### SIGWEB (Aba 1)
- Mapa interativo com Leaflet
- Filtros por estrutura organizacional (Comando/Unidade/Batalhão/Viatura)
- Filtros geográficos (Município/Bairro)
- Camadas: Limites dos Batalhões, Bases, Viaturas
- Popup com detalhes da viatura e Nota de Ocupação

### Dashboard (Aba 2)
- Cards KPI: Frota Total, % Ativos, Vida Útil Média, Horas/Mês
- Gráfico: Vida Útil Média por Categoria
- Tabelas: TOP 10 Mais Rodados, Mais Horas, Mais Manutenções
- Recomendações de descarte automáticas
- Valores FIPE por categoria

### Administrador (Aba 3)
- Interface preparada para funcionalidades futuras
- Placeholders para: Parâmetros, Usuários, Upload GeoJSON

## Cálculo da Nota de Ocupação

A Nota de Ocupação (0-100) é calculada considerando:
- Quilometragem acumulada vs. referência da categoria
- Manutenções nos últimos 6 meses
- Área de atuação (fator de severidade)

**Faixas**:
- 0-59: Crítico (vermelho)
- 60-79: Atenção (amarelo)  
- 80-100: Adequado (verde)

## Endpoints da API

### Veículos
- `GET /api/veiculos` - Lista veículos com filtros
- `GET /api/veiculos/{id}` - Detalhes do veículo
- `GET /api/veiculos/{id}/nota` - Nota de ocupação

### Geo
- `GET /api/geo/batalhoes` - Polígonos dos batalhões
- `GET /api/geo/bases` - Pontos das bases
- `GET /api/geo/viaturas` - Pontos das viaturas

### Dashboard
- `GET /api/dashboard/kpis` - Indicadores principais
- `GET /api/dashboard/vida_util_por_categoria` - Vida útil por categoria
- `GET /api/dashboard/fipe_por_categoria` - Valores FIPE
- `GET /api/dashboard/top_rodados` - Veículos mais rodados
- `GET /api/dashboard/top_horas` - Mais horas trabalhadas
- `GET /api/dashboard/top_manutencoes` - Mais manutenções
- `GET /api/recomendacoes` - Recomendações de descarte

## Dados de Exemplo

O script `app/seed.py` popula o banco com:
- 25 veículos de diferentes categorias
- 3 comandos, 6 unidades, 9 batalhões
- 3 municípios, 8 bairros
- Dados GeoJSON para mapas
- Histórico de manutenções e uso

## Testes e Validação

### Testar API
```bash
# KPIs do Dashboard
curl http://localhost:8000/api/dashboard/kpis

# Lista de veículos
curl http://localhost:8000/api/veiculos

# Dados GeoJSON de viaturas
curl http://localhost:8000/api/geo/viaturas
```

### Funcionalidades Principais Testadas

#### ✅ SIGWEB (Mapa)
- [x] Mapa Leaflet com camadas interativas
- [x] Filtros organizacionais (Comando/Unidade/Batalhão)
- [x] Filtros geográficos (Município/Bairro)
- [x] Busca por viatura específica
- [x] Popup com detalhes e Nota de Ocupação
- [x] Legenda de cores por faixa
- [x] Controle de camadas (toggle)

#### ✅ Dashboard
- [x] Cards KPI (Frota Total, % Ativos, Vida Útil, Horas/Mês)
- [x] Gráfico Chart.js: Vida Útil por Categoria
- [x] Tabela: Valores FIPE por Categoria
- [x] Rankings: TOP 10 Mais Rodados, Mais Horas, Mais Manutenções
- [x] Recomendações de Descarte automáticas
- [x] Cálculo da Nota de Ocupação (0-100)

#### ✅ Administrador
- [x] Interface placeholder preparada
- [x] Cards desabilitados com tooltips
- [x] Estrutura para funcionalidades futuras

### Exemplos de Uso

#### Filtrar viaturas por organização:
1. Acesse SIGWEB
2. Selecione "Comando Metropolitano"
3. Clique "Aplicar Filtros"
4. Observe as viaturas filtradas no mapa

#### Visualizar recomendações de descarte:
1. Acesse Dashboard
2. Role até "Recomendações de Descarte"
3. Veja veículos com nota baixa e motivos

#### Buscar viatura específica:
1. Digite "PM-001" no campo Viatura
2. O mapa centralizará na viatura
3. Popup abrirá automaticamente

## Arquitetura Técnica

### Backend (FastAPI)
- **Modelos**: SQLAlchemy ORM com SQLite
- **Schemas**: Pydantic para validação
- **Services**: Regras de negócio isoladas
- **Endpoints**: REST API com documentação automática
- **CORS**: Configurado para desenvolvimento local

### Frontend (HTML/CSS/JS)
- **Vanilla JS**: Sem frameworks, máxima compatibilidade
- **Leaflet**: Mapas interativos
- **Chart.js**: Gráficos responsivos
- **CSS Grid/Flexbox**: Layout responsivo
- **Fetch API**: Comunicação com backend

### Cálculo da Nota de Ocupação

Fórmula implementada em `app/services.py`:

```python
# Normalização (0-1)
km_norm = min(odometro_km / KM_REFERENCIA[categoria], 1.0)
mnt_norm = min(manutencoes_6m / MNT_MAX_6M, 1.0)

# Fator de severidade por área
area_fator = AREA_FATOR[area_atuacao]

# Cálculo final
desgaste = (W_KM * km_norm + W_MNT * mnt_norm) * area_fator
nota = round(100 * (1 - desgaste))
```

**Parâmetros configuráveis:**
- Peso quilometragem: 60%
- Peso manutenções: 40%
- Referências de km por categoria
- Fatores de área (Urbana: 1.0, Rural: 1.05, etc.)

## Próximos Passos

### Funcionalidades Futuras (Aba Admin)
- [ ] Configuração de parâmetros da Nota de Ocupação
- [ ] Gestão de usuários e perfis
- [ ] Upload de arquivos GeoJSON
- [ ] Relatórios personalizados
- [ ] Backup e restauração
- [ ] Logs de auditoria

### Melhorias Técnicas
- [ ] Autenticação JWT
- [ ] Banco PostgreSQL para produção
- [ ] Cache Redis
- [ ] API de integração FIPE
- [ ] Notificações push
- [ ] PWA (Progressive Web App)

## Suporte

- **Documentação da API**: http://localhost:8000/docs
- **Logs**: Console do navegador e terminal do servidor
- **Issues**: Verifique configuração de CORS e dependências
- **Performance**: Use filtros para reduzir dados carregados

---

**Sistema implementado com sucesso!** ✅

Todas as funcionalidades solicitadas foram implementadas:
- Backend FastAPI completo
- Frontend responsivo com 3 abas
- Cálculo da Nota de Ocupação
- Mapa interativo com filtros
- Dashboard com métricas e gráficos
- Dados de exemplo funcionais
- Scripts de inicialização automatizados
