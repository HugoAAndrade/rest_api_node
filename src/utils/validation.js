const Joi = require('joi');

// Schema para validação de email
const emailSchema = Joi.string()
  .email({ tlds: { allow: true } })
  .required()
  .messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  });

// Schema para validação de telefone
const phoneSchema = Joi.string()
  .pattern(/^[\d\s\-\(\)\+]+$/)
  .min(8)
  .max(20)
  .required()
  .messages({
    'string.pattern.base': 'Telefone deve conter apenas números, espaços, hífens, parênteses e sinal de mais',
    'string.min': 'Telefone deve ter pelo menos 8 caracteres',
    'string.max': 'Telefone deve ter no máximo 20 caracteres',
    'any.required': 'Telefone é obrigatório'
  });

// Schema para criação de contato
const contactSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório'
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Endereço deve ter pelo menos 5 caracteres',
      'string.max': 'Endereço deve ter no máximo 200 caracteres',
      'any.required': 'Endereço é obrigatório'
    }),

  email: emailSchema,

  phones: Joi.array()
    .items(phoneSchema)
    .min(1)
    .max(5)
    .unique()
    .required()
    .messages({
      'array.min': 'Deve haver pelo menos um telefone',
      'array.max': 'Máximo de 5 telefones permitidos',
      'array.unique': 'Telefones duplicados não são permitidos',
      'any.required': 'Telefones são obrigatórios'
    })
});

// Schema para atualização de contato (todos os campos opcionais)
const contactUpdateSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres'
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .messages({
      'string.min': 'Endereço deve ter pelo menos 5 caracteres',
      'string.max': 'Endereço deve ter no máximo 200 caracteres'
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .messages({
      'string.email': 'Email deve ter um formato válido'
    }),

  phones: Joi.array()
    .items(phoneSchema)
    .min(1)
    .max(5)
    .unique()
    .messages({
      'array.min': 'Deve haver pelo menos um telefone',
      'array.max': 'Máximo de 5 telefones permitidos',
      'array.unique': 'Telefones duplicados não são permitidos'
    })
}).min(1).messages({
  'object.min': 'Pelo menos um campo deve ser fornecido para atualização'
});

// Função para validar criação de contato
function validateContact(data) {
  return contactSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}

// Função para validar atualização de contato
function validateContactUpdate(data) {
  return contactUpdateSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}

// Função para validar parâmetros de query
const querySchema = Joi.object({
  name: Joi.string().trim().max(100),
  address: Joi.string().trim().max(200),
  email: Joi.string().email({ tlds: { allow: false } }),
  phone: Joi.string().trim().max(20),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

function validateQuery(data) {
  return querySchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}

module.exports = {
  validateContact,
  validateContactUpdate,
  validateQuery
};

