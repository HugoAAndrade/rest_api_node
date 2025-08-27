// Configuração global para testes
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:'; // Usar banco em memória para testes
process.env.HGBRASIL_API_KEY = 'test_key';

// Configurar timeout global para testes
jest.setTimeout(10000);

// Suprimir logs durante os testes
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

