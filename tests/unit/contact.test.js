const Contact = require('../../src/models/Contact');
const { database } = require('../../src/database/database');

// Mock do banco de dados para testes unitários
jest.mock('../../src/database/database', () => ({
  database: {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn()
  }
}));

describe('Contact Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um contato com sucesso', async () => {
      const contactData = {
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao@email.com',
        phones: ['(11) 99999-9999']
      };

      // Mock das operações do banco
      database.beginTransaction.mockResolvedValue();
      database.run.mockResolvedValueOnce({ id: 1 }); // Insert contact
      database.run.mockResolvedValueOnce({ id: 1 }); // Insert phone
      database.commit.mockResolvedValue();
      
      // Mock do findById para retornar o contato criado
      database.get.mockResolvedValueOnce({
        id: 1,
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao@email.com',
        created_at: '2024-01-01T10:00:00.000Z',
        updated_at: '2024-01-01T10:00:00.000Z',
        deleted_at: null
      });
      
      database.all.mockResolvedValueOnce([
        { phone_number: '(11) 99999-9999' }
      ]);

      const result = await Contact.create(contactData);

      expect(database.beginTransaction).toHaveBeenCalled();
      expect(database.run).toHaveBeenCalledWith(
        'INSERT INTO contacts (name, address, email) VALUES (?, ?, ?)',
        ['João Silva', 'Rua das Flores, 123, São Paulo, SP', 'joao@email.com']
      );
      expect(database.run).toHaveBeenCalledWith(
        'INSERT INTO phones (contact_id, phone_number) VALUES (?, ?)',
        [1, '(11) 99999-9999']
      );
      expect(database.commit).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Contact);
      expect(result.name).toBe('João Silva');
    });

    it('deve fazer rollback em caso de erro', async () => {
      const contactData = {
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao@email.com',
        phones: ['(11) 99999-9999']
      };

      database.beginTransaction.mockResolvedValue();
      database.run.mockRejectedValueOnce(new Error('Erro no banco'));
      database.rollback.mockResolvedValue();

      await expect(Contact.create(contactData)).rejects.toThrow('Erro no banco');
      expect(database.rollback).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('deve encontrar um contato por ID', async () => {
      const mockContact = {
        id: 1,
        name: 'João Silva',
        address: 'Rua das Flores, 123, São Paulo, SP',
        email: 'joao@email.com',
        created_at: '2024-01-01T10:00:00.000Z',
        updated_at: '2024-01-01T10:00:00.000Z',
        deleted_at: null
      };

      const mockPhones = [
        { phone_number: '(11) 99999-9999' },
        { phone_number: '(11) 3333-3333' }
      ];

      database.get.mockResolvedValueOnce(mockContact);
      database.all.mockResolvedValueOnce(mockPhones);

      const result = await Contact.findById(1);

      expect(database.get).toHaveBeenCalledWith(
        'SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL',
        [1]
      );
      expect(database.all).toHaveBeenCalledWith(
        'SELECT phone_number FROM phones WHERE contact_id = ?',
        [1]
      );
      expect(result).toBeInstanceOf(Contact);
      expect(result.phones).toEqual(['(11) 99999-9999', '(11) 3333-3333']);
    });

    it('deve retornar null se contato não for encontrado', async () => {
      database.get.mockResolvedValueOnce(null);

      const result = await Contact.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('emailExists', () => {
    it('deve retornar true se email existir', async () => {
      database.get.mockResolvedValueOnce({ id: 1 });

      const result = await Contact.emailExists('joao@email.com');

      expect(database.get).toHaveBeenCalledWith(
        'SELECT id FROM contacts WHERE email = ? AND deleted_at IS NULL',
        ['joao@email.com']
      );
      expect(result).toBe(true);
    });

    it('deve retornar false se email não existir', async () => {
      database.get.mockResolvedValueOnce(null);

      const result = await Contact.emailExists('naoexiste@email.com');

      expect(result).toBe(false);
    });

    it('deve excluir ID específico da verificação', async () => {
      database.get.mockResolvedValueOnce(null);

      await Contact.emailExists('joao@email.com', 1);

      expect(database.get).toHaveBeenCalledWith(
        'SELECT id FROM contacts WHERE email = ? AND deleted_at IS NULL AND id != ?',
        ['joao@email.com', 1]
      );
    });
  });

  describe('delete', () => {
    it('deve fazer soft delete de um contato', async () => {
      database.run.mockResolvedValueOnce({ changes: 1 });

      const result = await Contact.delete(1);

      expect(database.run).toHaveBeenCalledWith(
        'UPDATE contacts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
        [1]
      );
      expect(result).toEqual({
        success: true,
        message: 'Contato excluído com sucesso'
      });
    });

    it('deve lançar erro se contato não for encontrado', async () => {
      database.run.mockResolvedValueOnce({ changes: 0 });

      await expect(Contact.delete(999)).rejects.toThrow('Contato não encontrado ou já foi excluído');
    });
  });

  describe('findAll', () => {
    it('deve listar contatos sem filtros', async () => {
      const mockContacts = [
        {
          id: 1,
          name: 'João Silva',
          address: 'Rua das Flores, 123, São Paulo, SP',
          email: 'joao@email.com',
          created_at: '2024-01-01T10:00:00.000Z',
          updated_at: '2024-01-01T10:00:00.000Z',
          deleted_at: null
        }
      ];

      const mockPhones = [{ phone_number: '(11) 99999-9999' }];

      database.all.mockResolvedValueOnce(mockContacts);
      database.all.mockResolvedValueOnce(mockPhones);

      const result = await Contact.findAll();

      expect(database.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT c.* FROM contacts c'),
        []
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Contact);
    });

    it('deve aplicar filtros corretamente', async () => {
      database.all.mockResolvedValueOnce([]);

      await Contact.findAll({ name: 'João', email: 'joao@email.com' });

      expect(database.all).toHaveBeenCalledWith(
        expect.stringContaining('AND c.name LIKE ?'),
        expect.arrayContaining(['%João%', '%joao@email.com%'])
      );
    });
  });
});

