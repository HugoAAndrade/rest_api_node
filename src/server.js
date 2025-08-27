const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const contactRoutes = require('./routes/contactRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { initializeDatabase } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agenda Telefônica API',
      version: '1.0.0',
      description: 'API REST para gerenciar agenda telefônica com integração de clima',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desenvolvimento',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos com documentação
};

const specs = swaggerJsdoc(swaggerOptions);

// Configuração de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requests por IP
  message: {
    error: 'Muitas requisições deste IP, tente novamente em alguns minutos.'
  }
});

// Middlewares globais
app.use(helmet()); // Segurança
app.use(cors()); // CORS
app.use(limiter); // Rate limiting
app.use(express.json({ limit: '10mb' })); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded

// Documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rotas
app.use('/api/contacts', contactRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe.`
  });
});

// Inicialização do servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initializeDatabase();
    console.log('✅ Banco de dados inicializado com sucesso');

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health check disponível em http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

// Só inicializar o servidor se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;

