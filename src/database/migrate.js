const { initializeDatabase } = require('./database');

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migrações do banco de dados...');
    
    await initializeDatabase();
    
    console.log('✅ Migrações executadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
}

// Executar migrações se o arquivo for chamado diretamente
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

