const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.HGBRASIL_API_KEY;
    this.baseUrl = process.env.HGBRASIL_BASE_URL || 'https://api.hgbrasil.com/weather';
    this.timeout = 5000; // 5 segundos de timeout
  }

  // Extrair cidade do endereço
  extractCityFromAddress(address) {
    try {
      // Tentar extrair cidade do endereço
      // Formato esperado: "Rua, Número, Cidade, Estado"
      const parts = address.split(',').map(part => part.trim());
      
      if (parts.length >= 3) {
        // Assumir que a cidade é o penúltimo elemento
        return parts[parts.length - 2];
      } else if (parts.length === 2) {
        // Se só tem 2 partes, assumir que a segunda é a cidade
        return parts[1];
      } else {
        // Se só tem 1 parte, usar ela mesma
        return parts[0];
      }
    } catch (error) {
      console.error('Erro ao extrair cidade do endereço:', error);
      return null;
    }
  }

  // Buscar informações do clima
  async getWeatherInfo(address) {
    try {
      const city = this.extractCityFromAddress(address);
      
      if (!city) {
        throw new Error('Não foi possível extrair a cidade do endereço');
      }

      // Configurar parâmetros da requisição
      const params = {
        format: 'json-cors',
        city_name: city
      };

      // Adicionar chave da API se disponível
      if (this.apiKey && this.apiKey !== 'your_api_key_here') {
        params.key = this.apiKey;
      }

      console.log(`🌤️ Buscando clima para: ${city}`);

      // Fazer requisição para a API
      const response = await axios.get(this.baseUrl, {
        params,
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Agenda-Telefonica-API/1.0.0'
        }
      });

      // Verificar se a resposta é válida
      if (!response.data || !response.data.results) {
        throw new Error('Resposta inválida da API de clima');
      }

      const weatherData = response.data.results;

      // Extrair informações relevantes
      const weatherInfo = {
        city: weatherData.city || city,
        temperature: weatherData.temp || null,
        condition: weatherData.condition_slug || weatherData.description || null,
        description: weatherData.description || weatherData.condition_slug || null,
        humidity: weatherData.humidity || null,
        wind_speed: weatherData.wind_speedy || null,
        date: weatherData.date || new Date().toISOString().split('T')[0],
        time: weatherData.time || new Date().toTimeString().split(' ')[0]
      };

      console.log(`✅ Clima obtido para ${city}: ${weatherInfo.temperature}°C, ${weatherInfo.description}`);

      return weatherInfo;
    } catch (error) {
      console.error('❌ Erro ao buscar informações do clima:', error.message);
      
      // Retornar erro estruturado
      return {
        error: true,
        message: this.getErrorMessage(error),
        city: this.extractCityFromAddress(address) || 'Cidade não identificada'
      };
    }
  }

  // Gerar sugestão baseada no clima
  generateWeatherSuggestion(weatherInfo) {
    try {
      // Se houve erro ao buscar o clima
      if (weatherInfo.error) {
        return {
          suggestion: 'Não foi possível obter informações do clima no momento. Entre em contato assim mesmo!',
          weather_status: 'unavailable'
        };
      }

      const temperature = weatherInfo.temperature;
      const condition = weatherInfo.condition || weatherInfo.description || '';
      const isRainy = condition.toLowerCase().includes('chuva') || 
                     condition.toLowerCase().includes('chuvisco') ||
                     condition.toLowerCase().includes('rain') ||
                     condition.toLowerCase().includes('drizzle');
      const isSunny = condition.toLowerCase().includes('sol') || 
                     condition.toLowerCase().includes('limpo') ||
                     condition.toLowerCase().includes('clear') ||
                     condition.toLowerCase().includes('sunny');

      let suggestion = '';
      let weather_status = 'normal';

      // Aplicar regras de negócio para sugestões
      if (temperature <= 18) {
        suggestion = 'Ofereça um chocolate quente ao seu contato...';
        weather_status = 'cold';
      } else if (temperature >= 30 && isSunny) {
        suggestion = 'Convide seu contato para ir à praia com esse calor!';
        weather_status = 'hot_sunny';
      } else if (temperature >= 30 && isRainy) {
        suggestion = 'Convide seu contato para tomar um sorvete';
        weather_status = 'hot_rainy';
      } else if (temperature > 18 && temperature < 30 && isSunny) {
        suggestion = 'Convide seu contato para fazer alguma atividade ao ar livre';
        weather_status = 'mild_sunny';
      } else if (temperature > 18 && temperature < 30 && isRainy) {
        suggestion = 'Convide seu contato para ver um filme';
        weather_status = 'mild_rainy';
      } else {
        suggestion = 'Que tal entrar em contato e ver como está o dia?';
        weather_status = 'normal';
      }

      return {
        suggestion,
        weather_status,
        temperature,
        condition: weatherInfo.description || weatherInfo.condition,
        city: weatherInfo.city
      };
    } catch (error) {
      console.error('❌ Erro ao gerar sugestão do clima:', error);
      return {
        suggestion: 'Entre em contato com seu contato!',
        weather_status: 'error'
      };
    }
  }

  // Obter mensagem de erro amigável
  getErrorMessage(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'Timeout ao conectar com o serviço de clima';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'Serviço de clima indisponível no momento';
    } else if (error.response) {
      if (error.response.status === 401) {
        return 'Chave da API de clima inválida';
      } else if (error.response.status === 429) {
        return 'Limite de requisições da API de clima excedido';
      } else if (error.response.status >= 500) {
        return 'Erro interno do serviço de clima';
      } else {
        return 'Erro ao consultar serviço de clima';
      }
    } else {
      return 'Erro inesperado ao consultar clima';
    }
  }

  // Método para testar a conexão com a API
  async testConnection() {
    try {
      const testWeather = await this.getWeatherInfo('São Paulo, SP');
      return !testWeather.error;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new WeatherService();

