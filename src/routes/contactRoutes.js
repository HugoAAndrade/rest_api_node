const express = require('express');
const ContactController = require('../controllers/contactController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - email
 *         - phones
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do contato
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Nome do contato
 *         address:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           description: Endereço do contato
 *         email:
 *           type: string
 *           format: email
 *           description: Email do contato
 *         phones:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *           maxItems: 5
 *           description: Lista de telefones do contato
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data de última atualização
 *         weather:
 *           type: object
 *           description: Informações do clima (apenas no endpoint GET /:id)
 *           properties:
 *             city:
 *               type: string
 *               description: Cidade extraída do endereço
 *             temperature:
 *               type: number
 *               description: Temperatura atual em Celsius
 *             condition:
 *               type: string
 *               description: Condição climática
 *             suggestion:
 *               type: string
 *               description: Sugestão baseada no clima
 *             status:
 *               type: string
 *               enum: [cold, hot_sunny, hot_rainy, mild_sunny, mild_rainy, normal, unavailable, error]
 *               description: Status do clima para categorização
 *             available:
 *               type: boolean
 *               description: Se as informações do clima estão disponíveis
 *             error:
 *               type: string
 *               description: Mensagem de erro se o clima não estiver disponível
 *             last_updated:
 *               type: string
 *               format: date-time
 *               description: Última atualização das informações do clima
 *       example:
 *         id: 1
 *         name: "João Silva"
 *         address: "Rua das Flores, 123, São Paulo, SP"
 *         email: "joao.silva@email.com"
 *         phones: ["(11) 99999-9999", "(11) 3333-3333"]
 *         created_at: "2024-01-01T10:00:00.000Z"
 *         updated_at: "2024-01-01T10:00:00.000Z"
 *         weather:
 *           city: "São Paulo"
 *           temperature: 25
 *           condition: "Ensolarado"
 *           suggestion: "Convide seu contato para fazer alguma atividade ao ar livre"
 *           status: "mild_sunny"
 *           available: true
 *           last_updated: "2024-01-01T15:30:00.000Z"
 *     
 *     ContactInput:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - email
 *         - phones
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Nome do contato
 *         address:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           description: Endereço do contato
 *         email:
 *           type: string
 *           format: email
 *           description: Email do contato
 *         phones:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *           maxItems: 5
 *           description: Lista de telefones do contato
 *       example:
 *         name: "João Silva"
 *         address: "Rua das Flores, 123, São Paulo, SP"
 *         email: "joao.silva@email.com"
 *         phones: ["(11) 99999-9999", "(11) 3333-3333"]
 *     
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Tipo do erro
 *         message:
 *           type: string
 *           description: Mensagem de erro
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 *           description: Detalhes específicos do erro (para erros de validação)
 */

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Criar um novo contato
 *     tags: [Contatos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactInput'
 *     responses:
 *       201:
 *         description: Contato criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', ContactController.create);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Listar contatos com filtros opcionais
 *     tags: [Contatos]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nome (busca parcial)
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         description: Filtrar por endereço (busca parcial)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filtrar por email (busca parcial)
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Filtrar por telefone (busca parcial)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de contatos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', ContactController.list);

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: Buscar contato por ID
 *     tags: [Contatos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do contato
 *     responses:
 *       200:
 *         description: Contato encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Contato não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', ContactController.getById);

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: Atualizar contato
 *     tags: [Contatos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do contato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               address:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               email:
 *                 type: string
 *                 format: email
 *               phones:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 5
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: Contato atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Contato não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', ContactController.update);

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: Excluir contato (exclusão lógica)
 *     tags: [Contatos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do contato
 *     responses:
 *       200:
 *         description: Contato excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Contato não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', ContactController.delete);

module.exports = router;

