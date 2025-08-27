const Contact = require('../models/Contact');
const { validateContact, validateContactUpdate } = require('../utils/validation');
const weatherService = require('../services/weatherService');

class ContactController {
  // Criar novo contato
  static async create(req, res, next) {
    try {
      // Validar dados de entrada
      const { error, value } = validateContact(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const { name, address, email, phones } = value;

      // Verificar se email já existe
      const emailExists = await Contact.emailExists(email);
      if (emailExists) {
        const err = new Error('Email já está em uso por outro contato');
        err.status = 409;
        return next(err);
      }

      // Criar contato
      const contact = await Contact.create({ name, address, email, phones });

      res.status(201).json({
        success: true,
        message: 'Contato criado com sucesso',
        data: contact
      });
    } catch (error) {
      next(error);
    }
  }

  // Listar contatos com filtros
  static async list(req, res, next) {
    try {
      const { name, address, email, phone, page = 1, limit = 10 } = req.query;

      // Preparar filtros
      const filters = {};
      if (name) filters.name = name;
      if (address) filters.address = address;
      if (email) filters.email = email;
      if (phone) filters.phone = phone;

      // Buscar contatos
      const contacts = await Contact.findAll(filters);
      const total = await Contact.count(filters);

      // Paginação simples
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedContacts = contacts.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        message: 'Contatos listados com sucesso',
        data: paginatedContacts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar contato por ID
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        const err = new Error('ID do contato inválido');
        err.status = 400;
        return next(err);
      }

      const contact = await Contact.findById(parseInt(id));

      if (!contact) {
        const err = new Error('Contato não encontrado');
        err.status = 404;
        return next(err);
      }

      // Buscar informações do clima baseado no endereço do contato
      const weatherInfo = await weatherService.getWeatherInfo(contact.address);
      const weatherSuggestion = weatherService.generateWeatherSuggestion(weatherInfo);

      // Preparar resposta com informações do clima
      const response = {
        success: true,
        message: 'Contato encontrado com sucesso',
        data: {
          ...contact,
          weather: {
            city: weatherSuggestion.city || weatherInfo.city,
            temperature: weatherSuggestion.temperature,
            condition: weatherSuggestion.condition,
            suggestion: weatherSuggestion.suggestion,
            status: weatherSuggestion.weather_status,
            last_updated: new Date().toISOString()
          }
        }
      };

      // Se houve erro no clima, adicionar informação de erro
      if (weatherInfo.error) {
        response.data.weather.error = weatherInfo.message;
        response.data.weather.available = false;
      } else {
        response.data.weather.available = true;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Atualizar contato
  static async update(req, res, next) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        const err = new Error('ID do contato inválido');
        err.status = 400;
        return next(err);
      }

      // Validar dados de entrada
      const { error, value } = validateContactUpdate(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const { name, address, email, phones } = value;

      // Verificar se contato existe
      const existingContact = await Contact.findById(parseInt(id));
      if (!existingContact) {
        const err = new Error('Contato não encontrado');
        err.status = 404;
        return next(err);
      }

      // Verificar se email já existe (para outro contato)
      if (email && email !== existingContact.email) {
        const emailExists = await Contact.emailExists(email, parseInt(id));
        if (emailExists) {
          const err = new Error('Email já está em uso por outro contato');
          err.status = 409;
          return next(err);
        }
      }

      // Atualizar contato
      const updatedContact = await Contact.update(parseInt(id), { name, address, email, phones });

      res.status(200).json({
        success: true,
        message: 'Contato atualizado com sucesso',
        data: updatedContact
      });
    } catch (error) {
      next(error);
    }
  }

  // Excluir contato (soft delete)
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        const err = new Error('ID do contato inválido');
        err.status = 400;
        return next(err);
      }

      // Verificar se contato existe
      const existingContact = await Contact.findById(parseInt(id));
      if (!existingContact) {
        const err = new Error('Contato não encontrado');
        err.status = 404;
        return next(err);
      }

      // Excluir contato (soft delete)
      await Contact.delete(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Contato excluído com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ContactController;

