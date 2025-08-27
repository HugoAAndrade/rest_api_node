const { database } = require('../database/database');

class Contact {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.email = data.email;
    this.phones = data.phones || [];
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.deleted_at = data.deleted_at;
  }

  // Criar um novo contato
  static async create(contactData) {
    const { name, address, email, phones } = contactData;
    
    try {
      await database.beginTransaction();

      // Inserir contato
      const contactResult = await database.run(
        'INSERT INTO contacts (name, address, email) VALUES (?, ?, ?)',
        [name, address, email]
      );

      const contactId = contactResult.id;

      // Inserir telefones
      if (phones && phones.length > 0) {
        for (const phone of phones) {
          await database.run(
            'INSERT INTO phones (contact_id, phone_number) VALUES (?, ?)',
            [contactId, phone]
          );
        }
      }

      await database.commit();

      // Buscar o contato criado com os telefones
      return await Contact.findById(contactId);
    } catch (error) {
      await database.rollback();
      throw error;
    }
  }

  // Buscar contato por ID
  static async findById(id) {
    try {
      const contact = await database.get(
        'SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (!contact) {
        return null;
      }

      const phones = await database.all(
        'SELECT phone_number FROM phones WHERE contact_id = ?',
        [id]
      );

      return new Contact({
        ...contact,
        phones: phones.map(p => p.phone_number)
      });
    } catch (error) {
      throw error;
    }
  }

  // Listar contatos com filtros
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT DISTINCT c.* FROM contacts c
        LEFT JOIN phones p ON c.id = p.contact_id
        WHERE c.deleted_at IS NULL
      `;
      const params = [];

      // Aplicar filtros
      if (filters.name) {
        sql += ' AND c.name LIKE ?';
        params.push(`%${filters.name}%`);
      }

      if (filters.address) {
        sql += ' AND c.address LIKE ?';
        params.push(`%${filters.address}%`);
      }

      if (filters.email) {
        sql += ' AND c.email LIKE ?';
        params.push(`%${filters.email}%`);
      }

      if (filters.phone) {
        sql += ' AND p.phone_number LIKE ?';
        params.push(`%${filters.phone}%`);
      }

      sql += ' ORDER BY c.name ASC';

      const contacts = await database.all(sql, params);

      // Buscar telefones para cada contato
      const contactsWithPhones = await Promise.all(
        contacts.map(async (contact) => {
          const phones = await database.all(
            'SELECT phone_number FROM phones WHERE contact_id = ?',
            [contact.id]
          );

          return new Contact({
            ...contact,
            phones: phones.map(p => p.phone_number)
          });
        })
      );

      return contactsWithPhones;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar contato
  static async update(id, contactData) {
    const { name, address, email, phones } = contactData;
    
    try {
      await database.beginTransaction();

      // Verificar se o contato existe e não foi deletado
      const existingContact = await database.get(
        'SELECT id FROM contacts WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (!existingContact) {
        throw new Error('Contato não encontrado');
      }

      // Atualizar dados do contato
      await database.run(
        'UPDATE contacts SET name = ?, address = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, address, email, id]
      );

      // Remover telefones antigos
      await database.run(
        'DELETE FROM phones WHERE contact_id = ?',
        [id]
      );

      // Inserir novos telefones
      if (phones && phones.length > 0) {
        for (const phone of phones) {
          await database.run(
            'INSERT INTO phones (contact_id, phone_number) VALUES (?, ?)',
            [id, phone]
          );
        }
      }

      await database.commit();

      // Retornar contato atualizado
      return await Contact.findById(id);
    } catch (error) {
      await database.rollback();
      throw error;
    }
  }

  // Exclusão lógica (soft delete)
  static async delete(id) {
    try {
      const result = await database.run(
        'UPDATE contacts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (result.changes === 0) {
        throw new Error('Contato não encontrado ou já foi excluído');
      }

      return { success: true, message: 'Contato excluído com sucesso' };
    } catch (error) {
      throw error;
    }
  }

  // Verificar se email já existe (para outro contato)
  static async emailExists(email, excludeId = null) {
    try {
      let sql = 'SELECT id FROM contacts WHERE email = ? AND deleted_at IS NULL';
      const params = [email];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await database.get(sql, params);
      return !!result;
    } catch (error) {
      throw error;
    }
  }

  // Verificar se telefone já existe para o mesmo contato
  static async phoneExistsForContact(contactId, phone) {
    try {
      const result = await database.get(
        'SELECT id FROM phones WHERE contact_id = ? AND phone_number = ?',
        [contactId, phone]
      );
      return !!result;
    } catch (error) {
      throw error;
    }
  }

  // Contar total de contatos (não deletados)
  static async count(filters = {}) {
    try {
      let sql = `
        SELECT COUNT(DISTINCT c.id) as total FROM contacts c
        LEFT JOIN phones p ON c.id = p.contact_id
        WHERE c.deleted_at IS NULL
      `;
      const params = [];

      // Aplicar filtros
      if (filters.name) {
        sql += ' AND c.name LIKE ?';
        params.push(`%${filters.name}%`);
      }

      if (filters.address) {
        sql += ' AND c.address LIKE ?';
        params.push(`%${filters.address}%`);
      }

      if (filters.email) {
        sql += ' AND c.email LIKE ?';
        params.push(`%${filters.email}%`);
      }

      if (filters.phone) {
        sql += ' AND p.phone_number LIKE ?';
        params.push(`%${filters.phone}%`);
      }

      const result = await database.get(sql, params);
      return result.total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Contact;

