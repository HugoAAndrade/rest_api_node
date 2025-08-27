const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'agenda.db');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      // Criar diretório se não existir
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Erro ao conectar com o banco de dados:', err);
          reject(err);
        } else {
          console.log('✅ Conectado ao banco de dados SQLite');
          resolve();
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Conexão com banco de dados fechada');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  async commit() {
    return this.run('COMMIT');
  }

  async rollback() {
    return this.run('ROLLBACK');
  }
}

// Instância singleton do banco
const database = new Database();

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    await database.connect();
    await createTables();
    console.log('✅ Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Função para criar as tabelas
async function createTables() {
  // Tabela de contatos
  const createContactsTable = `
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    )
  `;

  // Tabela de telefones
  const createPhonesTable = `
    CREATE TABLE IF NOT EXISTS phones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      phone_number TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
      UNIQUE(contact_id, phone_number)
    )
  `;

  // Índices para melhor performance
  const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)',
    'CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name)',
    'CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts(deleted_at)',
    'CREATE INDEX IF NOT EXISTS idx_phones_contact_id ON phones(contact_id)',
    'CREATE INDEX IF NOT EXISTS idx_phones_number ON phones(phone_number)'
  ];

  try {
    await database.run(createContactsTable);
    await database.run(createPhonesTable);
    
    for (const indexSql of createIndexes) {
      await database.run(indexSql);
    }
    
    console.log('✅ Tabelas criadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

module.exports = {
  database,
  initializeDatabase
};

