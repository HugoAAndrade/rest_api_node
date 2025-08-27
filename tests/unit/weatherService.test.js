const axios = require('axios');
const weatherService = require('../../src/services/weatherService');

// Mock do axios
jest.mock('axios');
const mockedAxios = axios;

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractCityFromAddress', () => {
    it('deve extrair cidade de endereço completo', () => {
      const address = 'Rua das Flores, 123, São Paulo, SP';
      const city = weatherService.extractCityFromAddress(address);
      expect(city).toBe('São Paulo');
    });

    it('deve extrair cidade de endereço com 2 partes', () => {
      const address = 'Centro, Rio de Janeiro';
      const city = weatherService.extractCityFromAddress(address);
      expect(city).toBe('Rio de Janeiro');
    });

    it('deve retornar o próprio endereço se só tiver 1 parte', () => {
      const address = 'Brasília';
      const city = weatherService.extractCityFromAddress(address);
      expect(city).toBe('Brasília');
    });

    it('deve retornar null em caso de erro', () => {
      const city = weatherService.extractCityFromAddress(null);
      expect(city).toBeNull();
    });
  });

  describe('getWeatherInfo', () => {
    it('deve retornar informações do clima com sucesso', async () => {
      const mockResponse = {
        data: {
          results: {
            city: 'São Paulo',
            temp: 25,
            condition_slug: 'clear_day',
            description: 'Ensolarado',
            humidity: 60,
            wind_speedy: '10 km/h',
            date: '2024-01-01',
            time: '15:30'
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await weatherService.getWeatherInfo('Rua das Flores, 123, São Paulo, SP');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            city_name: 'São Paulo',
            format: 'json-cors'
          })
        })
      );

      expect(result).toEqual({
        city: 'São Paulo',
        temperature: 25,
        condition: 'clear_day',
        description: 'Ensolarado',
        humidity: 60,
        wind_speed: '10 km/h',
        date: '2024-01-01',
        time: '15:30'
      });
    });

    it('deve retornar erro quando API falha', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await weatherService.getWeatherInfo('Rua das Flores, 123, São Paulo, SP');

      expect(result.error).toBe(true);
      expect(result.message).toBe('Erro inesperado ao consultar clima');
      expect(result.city).toBe('São Paulo');
    });

    it('deve retornar erro quando resposta é inválida', async () => {
      const mockResponse = {
        data: {}
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await weatherService.getWeatherInfo('Rua das Flores, 123, São Paulo, SP');

      expect(result.error).toBe(true);
      expect(result.message).toBe('Erro inesperado ao consultar clima');
    });
  });

  describe('generateWeatherSuggestion', () => {
    it('deve sugerir chocolate quente para temperatura baixa', () => {
      const weatherInfo = {
        temperature: 15,
        condition: 'clear_day',
        description: 'Ensolarado',
        city: 'São Paulo'
      };

      const result = weatherService.generateWeatherSuggestion(weatherInfo);

      expect(result.suggestion).toBe('Ofereça um chocolate quente ao seu contato...');
      expect(result.weather_status).toBe('cold');
      expect(result.temperature).toBe(15);
    });

    it('deve sugerir praia para temperatura alta e ensolarado', () => {
      const weatherInfo = {
        temperature: 35,
        condition: 'clear_day',
        description: 'Ensolarado',
        city: 'Rio de Janeiro'
      };

      const result = weatherService.generateWeatherSuggestion(weatherInfo);

      expect(result.suggestion).toBe('Convide seu contato para ir à praia com esse calor!');
      expect(result.weather_status).toBe('hot_sunny');
    });

    it('deve sugerir sorvete para temperatura alta e chuvoso', () => {
      const weatherInfo = {
        temperature: 32,
        condition: 'rain',
        description: 'Chuva',
        city: 'Salvador'
      };

      const result = weatherService.generateWeatherSuggestion(weatherInfo);

      expect(result.suggestion).toBe('Convide seu contato para tomar um sorvete');
      expect(result.weather_status).toBe('hot_rainy');
    });

    it('deve sugerir atividade ao ar livre para temperatura amena e ensolarado', () => {
      const weatherInfo = {
        temperature: 25,
        condition: 'clear_day',
        description: 'Ensolarado',
        city: 'Belo Horizonte'
      };

      const result = weatherService.generateWeatherSuggestion(weatherInfo);

      expect(result.suggestion).toBe('Convide seu contato para fazer alguma atividade ao ar livre');
      expect(result.weather_status).toBe('mild_sunny');
    });

    it('deve sugerir filme para temperatura amena e chuvoso', () => {
      const weatherInfo = {
        temperature: 22,
        condition: 'rain',
        description: 'Chuva',
        city: 'Porto Alegre'
      };

      const result = weatherService.generateWeatherSuggestion(weatherInfo);

      expect(result.suggestion).toBe('Convide seu contato para ver um filme');
      expect(result.weather_status).toBe('mild_rainy');
    });

    it('deve retornar sugestão padrão para condições normais', () => {
      const weatherInfo = {
        temperature: 20,
        condition: 'cloudy',
        description: 'Nublado',
        city: 'Curitiba'
      };

      const result = weatherService.generateWeatherSuggestion(weatherInfo);

      expect(result.suggestion).toBe('Que tal entrar em contato e ver como está o dia?');
      expect(result.weather_status).toBe('normal');
    });

    it('deve tratar erro no clima', () => {
      const weatherInfo = {
        error: true,
        message: 'API indisponível',
        city: 'São Paulo'
      };

      const result = weatherService.generateWeatherSuggestion(weatherInfo);

      expect(result.suggestion).toBe('Não foi possível obter informações do clima no momento. Entre em contato assim mesmo!');
      expect(result.weather_status).toBe('unavailable');
    });

    it('deve tratar erro na geração de sugestão', () => {
      const result = weatherService.generateWeatherSuggestion(null);

      expect(result.suggestion).toBe('Entre em contato com seu contato!');
      expect(result.weather_status).toBe('error');
    });
  });

  describe('getErrorMessage', () => {
    it('deve retornar mensagem para timeout', () => {
      const error = { code: 'ECONNABORTED' };
      const message = weatherService.getErrorMessage(error);
      expect(message).toBe('Timeout ao conectar com o serviço de clima');
    });

    it('deve retornar mensagem para conexão recusada', () => {
      const error = { code: 'ECONNREFUSED' };
      const message = weatherService.getErrorMessage(error);
      expect(message).toBe('Serviço de clima indisponível no momento');
    });

    it('deve retornar mensagem para erro 401', () => {
      const error = { response: { status: 401 } };
      const message = weatherService.getErrorMessage(error);
      expect(message).toBe('Chave da API de clima inválida');
    });

    it('deve retornar mensagem para erro 429', () => {
      const error = { response: { status: 429 } };
      const message = weatherService.getErrorMessage(error);
      expect(message).toBe('Limite de requisições da API de clima excedido');
    });

    it('deve retornar mensagem para erro 500', () => {
      const error = { response: { status: 500 } };
      const message = weatherService.getErrorMessage(error);
      expect(message).toBe('Erro interno do serviço de clima');
    });

    it('deve retornar mensagem genérica para outros erros', () => {
      const error = { message: 'Erro desconhecido' };
      const message = weatherService.getErrorMessage(error);
      expect(message).toBe('Erro inesperado ao consultar clima');
    });
  });
});

