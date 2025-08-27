const request = require('supertest');
const app = require('../../src/server');
const { database } = require('../../src/database/database');

describe('Contacts API Integration Tests', () => {
  let testContactId;

  beforeAll(async () => {
    // Conectar ao banco de dados de teste
    await database.connect();
    
    // Limpar tabelas
    await database.run('DELETE FROM phones');
    await database.run('DELETE FROM contacts');
    await database.run('DELETE FROM sqlite_sequence WHERE name IN ("contacts", "phones")');
  });

  afterAll(async () => {
    // Limpar e fechar banco
    await database.run('DELETE FROM phones');
    await database.run('DELETE FROM contacts');
    await database.close();
  });

  beforeEach(async () => {
    // Limpar dados entre testes
    await database.run('DELETE FROM phones');
    await database.run('DELETE FROM contacts');
  });

  describe('POST /api/contacts', () => {
    it('deve criar um contato com sucesso', async () => {
      const contactData = {
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao.silva@email.com',
        phones: ['(11) 99999-9999', '(11) 3333-3333']
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(contactData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contato criado com sucesso');
      expect(response.body.data).toMatchObject({
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao.silva@email.com',
        phones: ['(11) 99999-9999', '(11) 3333-3333']
      });
      expect(response.body.data.id).toBeDefined();

      testContactId = response.body.data.id;
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidData = {
        name: 'A', // Nome muito curto
        address: 'Rua', // Endereço muito curto
        email: 'email-inválido',
        phones: [] // Array vazio
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('deve retornar erro para email duplicado', async () => {
      const contactData = {
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao.silva@email.com',
        phones: ['(11) 99999-9999']
      };

      // Criar primeiro contato
      await request(app)
        .post('/api/contacts')
        .send(contactData)
        .expect(201);

      // Tentar criar segundo contato com mesmo email
      const response = await request(app)
        .post('/api/contacts')
        .send({
          ...contactData,
          name: 'Maria Silva'
        })
        .expect(409);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Email já está em uso');
    });
  });

  describe('GET /api/contacts', () => {
    beforeEach(async () => {
      // Criar contatos de teste
      const contacts = [
        {
          name: 'João Silva',
          address: 'Rua das Flores, 123, São Paulo, SP',
          email: 'joao.silva@email.com',
          phones: ['(11) 99999-9999']
        },
        {
          name: 'Maria Santos',
          address: 'Av. Paulista, 456, São Paulo, SP',
          email: 'maria.santos@email.com',
          phones: ['(11) 88888-8888']
        }
      ];

      for (const contact of contacts) {
        await request(app)
          .post('/api/contacts')
          .send(contact);
      }
    });

    it('deve listar todos os contatos', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });
    });

    it('deve filtrar contatos por nome', async () => {
      const response = await request(app)
        .get('/api/contacts?name=João')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('João Silva');
    });

    it('deve filtrar contatos por email', async () => {
      const response = await request(app)
        .get('/api/contacts?email=maria.santos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('maria.santos@email.com');
    });

    it('deve aplicar paginação', async () => {
      const response = await request(app)
        .get('/api/contacts?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/contacts/:id', () => {
    beforeEach(async () => {
      // Criar contato de teste
      const contactData = {
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao.silva@email.com',
        phones: ['(11) 99999-9999']
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(contactData);

      testContactId = response.body.data.id;
    });

    it('deve buscar contato por ID com informações do clima', async () => {
      const response = await request(app)
        .get(`/api/contacts/${testContactId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testContactId);
      expect(response.body.data.name).toBe('João Silva');
      expect(response.body.data.weather).toBeDefined();
      expect(response.body.data.weather.city).toBeDefined();
      expect(response.body.data.weather.suggestion).toBeDefined();
      expect(response.body.data.weather.status).toBeDefined();
    });

    it('deve retornar erro para ID inválido', async () => {
      const response = await request(app)
        .get('/api/contacts/invalid-id')
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('ID do contato inválido');
    });

    it('deve retornar erro para contato não encontrado', async () => {
      const response = await request(app)
        .get('/api/contacts/999')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Contato não encontrado');
    });
  });

  describe('PUT /api/contacts/:id', () => {
    beforeEach(async () => {
      // Criar contato de teste
      const contactData = {
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao.silva@email.com',
        phones: ['(11) 99999-9999']
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(contactData);

      testContactId = response.body.data.id;
    });

    it('deve atualizar contato com sucesso', async () => {
      const updateData = {
        name: 'João Silva Santos',
        address: 'Rua das Rosas, 456, Rio de Janeiro, RJ',
        email: 'joao.santos@email.com',
        phones: ['(21) 99999-9999', '(21) 88888-8888']
      };

      const response = await request(app)
        .put(`/api/contacts/${testContactId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('João Silva Santos');
      expect(response.body.data.address).toBe('Rua das Rosas, 456, Rio de Janeiro, RJ');
      expect(response.body.data.email).toBe('joao.santos@email.com');
      expect(response.body.data.phones).toEqual(['(21) 99999-9999', '(21) 88888-8888']);
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const updateData = {
        name: 'João Silva Santos'
      };

      const response = await request(app)
        .put(`/api/contacts/${testContactId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('João Silva Santos');
      expect(response.body.data.email).toBe('joao.silva@email.com'); // Não alterado
    });

    it('deve retornar erro para contato não encontrado', async () => {
      const updateData = {
        name: 'João Silva Santos'
      };

      const response = await request(app)
        .put('/api/contacts/999')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Contato não encontrado');
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    beforeEach(async () => {
      // Criar contato de teste
      const contactData = {
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao.silva@email.com',
        phones: ['(11) 99999-9999']
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(contactData);

      testContactId = response.body.data.id;
    });

    it('deve excluir contato com sucesso (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/contacts/${testContactId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contato excluído com sucesso');

      // Verificar se contato não aparece mais na listagem
      const listResponse = await request(app)
        .get('/api/contacts')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(0);

      // Verificar se contato não pode ser encontrado por ID
      await request(app)
        .get(`/api/contacts/${testContactId}`)
        .expect(404);
    });

    it('deve retornar erro para contato não encontrado', async () => {
      const response = await request(app)
        .delete('/api/contacts/999')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Contato não encontrado');
    });
  });

  describe('Health Check', () => {
    it('deve retornar status OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
});

