# 📞 Agenda Telefônica API

Uma API REST completa em Node.js para gerenciar agenda telefônica com integração de informações climáticas e sugestões inteligentes.

## 🚀 Funcionalidades

### CRUD de Contatos

- ✅ **Criar contato** - Cadastro com nome, endereço, email e múltiplos telefones
- ✅ **Listar contatos** - Listagem com filtros por nome, endereço, email e telefone
- ✅ **Exibir contato** - Visualização detalhada com informações do clima
- ✅ **Atualizar contato** - Edição de dados com validações
- ✅ **Excluir contato** - Exclusão lógica (soft delete)

### Integração com Clima

- 🌤️ **API HgBrasil Weather** - Informações meteorológicas em tempo real
- 🎯 **Sugestões inteligentes** - Recomendações baseadas no clima da cidade do contato
- 🛡️ **Tolerância a falhas** - Funcionamento mesmo com API externa indisponível

### Recursos Avançados

- 📊 **Documentação Swagger** - Interface interativa para testar a API
- 🧪 **Testes completos** - Cobertura de testes unitários e de integração
- 🐳 **Docker** - Containerização para deploy simplificado
- 🔒 **Segurança** - Rate limiting, validações e sanitização de dados

## 🏗️ Arquitetura

### Estrutura do Projeto

```
agenda-telefonica/
├── src/
│   ├── controllers/     # Controladores da API
│   ├── models/         # Modelos de dados
│   ├── services/       # Serviços externos (clima)
│   ├── middlewares/    # Middlewares (validação, erros)
│   ├── routes/         # Definição das rotas
│   ├── database/       # Configuração do banco de dados
│   ├── utils/          # Utilitários (validações)
│   └── server.js       # Servidor principal
├── tests/
│   ├── unit/           # Testes unitários
│   └── integration/    # Testes de integração
├── docker-compose.yml  # Configuração Docker
├── Dockerfile         # Imagem Docker
└── README.md          # Documentação
```

### Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Banco de dados relacional
- **Joi** - Validação de dados
- **Axios** - Cliente HTTP para APIs externas
- **Swagger** - Documentação da API
- **Jest** - Framework de testes
- **Docker** - Containerização

### Padrões Adotados

- **MVC** - Separação de responsabilidades
- **Repository Pattern** - Abstração do acesso a dados
- **Service Layer** - Lógica de negócio isolada
- **Error Handling** - Tratamento centralizado de erros
- **Validation** - Validação de entrada com Joi
- **Soft Delete** - Exclusão lógica de registros

## 📋 Regras de Negócio

### Validações de Contato

- **Nome**: 2-100 caracteres, obrigatório
- **Endereço**: 5-200 caracteres, obrigatório
- **Email**: Formato válido, único no sistema
- **Telefones**: 1-5 números por contato, sem duplicatas

### Sugestões por Clima

- **≤ 18°C**: "Ofereça um chocolate quente ao seu contato..."
- **≥ 30°C + Sol**: "Convide seu contato para ir à praia com esse calor!"
- **≥ 30°C + Chuva**: "Convide seu contato para tomar um sorvete"
- **18-30°C + Sol**: "Convide seu contato para fazer alguma atividade ao ar livre"
- **18-30°C + Chuva**: "Convide seu contato para ver um filme"

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Docker (opcional)

### Instalação Local

1. **Clone o repositório**

```bash
git clone <repository-url>
cd agenda-telefonica
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Execute as migrações do banco**

```bash
npm run migrate
```

5. **Inicie o servidor**

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### Configuração da API de Clima

1. Acesse [HgBrasil Console](https://console.hgbrasil.com/)
2. Crie uma conta gratuita
3. Obtenha sua chave da API
4. Configure no arquivo `.env`:

```env
HGBRASIL_API_KEY=chave_api
```

## 🐳 Docker

### Execução com Docker Compose

1. **Produção**

```bash
docker-compose up -d
```

2. **Desenvolvimento**

```bash
docker-compose --profile dev up -d
```

### Build Manual

```bash
# Build da imagem
docker build -t agenda-telefonica .

# Execução
docker run -p 3000:3000 agenda-telefonica
```

## 🧪 Testes

### Executar Todos os Testes

```bash
npm test
```

### Testes com Cobertura

```bash
npm run test:coverage
```

### Testes em Modo Watch

```bash
npm run test:watch
```

### Estrutura de Testes

- **Testes Unitários**: Validações, modelos e serviços
- **Testes de Integração**: Endpoints completos da API
- **Cobertura**: Relatórios detalhados de cobertura de código

## 📚 Documentação da API

### Swagger UI

Acesse a documentação interativa em: `http://localhost:3000/api-docs`

### Endpoints Principais

#### Contatos

- `POST /api/contacts` - Criar contato
- `GET /api/contacts` - Listar contatos (com filtros)
- `GET /api/contacts/:id` - Buscar contato (com clima)
- `PUT /api/contacts/:id` - Atualizar contato
- `DELETE /api/contacts/:id` - Excluir contato

#### Utilitários

- `GET /health` - Health check da aplicação

### Exemplos de Uso

#### Criar Contato

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "address": "Rua das Flores, 123, São Paulo, SP",
    "email": "joao.silva@email.com",
    "phones": ["(11) 99999-9999", "(11) 3333-3333"]
  }'
```

#### Buscar Contato com Clima

```bash
curl http://localhost:3000/api/contacts/1
```

#### Listar com Filtros

```bash
curl "http://localhost:3000/api/contacts?name=João&city=São Paulo"
```

## 🔧 Configurações Avançadas

### Variáveis de Ambiente

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
DB_PATH=./src/database/agenda.db

# API Externa
HGBRASIL_API_KEY=sua_chave
HGBRASIL_BASE_URL=https://api.hgbrasil.com/weather

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Monitoramento

- **Health Check**: `GET /health`
- **Logs**: Estruturados com níveis de severidade
- **Métricas**: Tempo de resposta e taxa de erro

## 🚨 Tratamento de Erros

### Tipos de Erro

- **400 Bad Request**: Dados inválidos
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Email duplicado
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Erro interno

### Formato de Resposta de Erro

```json
{
  "error": "Tipo do erro",
  "message": "Descrição do erro",
  "details": [
    {
      "field": "campo",
      "message": "mensagem específica"
    }
  ]
}
```

## 🔒 Segurança

### Medidas Implementadas

- **Helmet**: Headers de segurança
- **CORS**: Controle de origem cruzada
- **Rate Limiting**: Proteção contra spam
- **Validação**: Sanitização de entrada
- **SQL Injection**: Queries parametrizadas

## 📈 Performance

### Otimizações

- **Índices de Banco**: Consultas otimizadas
- **Connection Pooling**: Reutilização de conexões
- **Caching**: Cache de respostas da API externa
- **Compressão**: Gzip para respostas HTTP

<!-- ## 🤝 Contribuição

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request -->

### Padrões de Código

- ESLint para linting
- Prettier para formatação
- Conventional Commits
- Testes obrigatórios

<!-- ## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. -->

## 👥 Autor

Desenvolvido como teste técnico para vaga de Desenvolvedor Back-End Node.js.

---

<!-- ## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação
2. Consulte os logs da aplicação
3. Abra uma issue no repositório

**Status do Projeto**: ✅ Completo e funcional -->
