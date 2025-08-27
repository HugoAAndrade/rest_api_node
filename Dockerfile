# Use a imagem oficial do Node.js como base
FROM node:20-alpine

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY src/ ./src/

# Copiar arquivo de configuração de ambiente
COPY .env ./

# Criar diretório para banco de dados
RUN mkdir -p /app/data

# Definir variável de ambiente para o banco de dados
ENV DB_PATH=/app/data/agenda.db

# Expor a porta da aplicação
EXPOSE 3000

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Dar permissões ao usuário nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"]

