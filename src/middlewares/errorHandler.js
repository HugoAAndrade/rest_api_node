const errorHandler = (err, req, res, next) => {
  console.error('❌ Erro capturado:', err);

  // Erro de validação do Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Dados inválidos',
      message: 'Os dados fornecidos não atendem aos critérios de validação',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Erro de constraint do SQLite (telefone duplicado, etc.)
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      error: 'Conflito de dados',
      message: 'Já existe um registro com essas informações'
    });
  }

  // Erro de banco de dados SQLite
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro na operação do banco de dados'
    });
  }

  // Erro customizado com status
  if (err.status) {
    return res.status(err.status).json({
      error: err.name || 'Erro',
      message: err.message
    });
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'O corpo da requisição contém JSON malformado'
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ocorreu um erro interno no servidor' 
      : err.message
  });
};

module.exports = errorHandler;

