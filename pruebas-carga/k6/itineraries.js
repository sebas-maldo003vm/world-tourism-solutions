import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (
  __ENV.BASE_URL ||
  'https://world-tourism-solutions.onrender.com'
).replace(/\/$/, '');

const LOGIN_URL = `${BASE_URL}/api/auth/login`;
const ITINERARY_URL = `${BASE_URL}/api/itineraries/proposals`;

const EMAIL = "prueba1turistaseb@email.com";
const PASSWORD = "Hola12345";

const VUS = parseInt(__ENV.VUS || '5', 10);
const THINK_TIME_S = parseFloat(__ENV.THINK_TIME_S || '3');

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'Debes configurar USER_EMAIL y USER_PASSWORD.'
  );
}

export const options = {
  scenarios: {
    itinerarios: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: VUS },
        { duration: '30s', target: VUS },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },

  summaryTrendStats: [
    'avg',
    'min',
    'med',
    'max',
    'p(90)',
    'p(95)',
    'p(99)',
  ],

  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

// El login se ejecuta una vez antes de iniciar la carga.
// El JWT se comparte entre los usuarios virtuales.
export function setup() {
  const loginBody = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
  });

  const loginResponse = http.post(LOGIN_URL, loginBody, {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      endpoint: 'login',
    },
  });

  check(loginResponse, {
    'login: HTTP 200': (r) => r.status === 200,
    'login: contiene token': (r) => {
      try {
        return Boolean(r.json('token'));
      } catch (e) {
        return false;
      }
    },
  });

  if (loginResponse.status !== 200) {
    throw new Error(
      `No se pudo iniciar sesión. HTTP ${loginResponse.status}`
    );
  }

  const token = loginResponse.json('token');
  const tokenType = loginResponse.json('tokenType') || 'Bearer';

  if (!token) {
    throw new Error('La respuesta de login no contiene token.');
  }

  return {
    authorization: `${tokenType} ${token}`,
  };
}

export default function (data) {
  // Fecha futura para evitar enviar una fecha de viaje vencida.
  const futureDate = new Date(
    Date.now() + 2 * 24 * 60 * 60 * 1000
  ).toISOString().slice(0, 10);

  const body = JSON.stringify({
    date: futureDate,
    filters: {
      search: '',
      categories: [
        'ACTIVIDAD',
        'HOSPEDAJE',
        'RESTAURANTE'
      ],
      radiusKm: 15,
      originLatitude: 4.711,
      originLongitude: -74.0721,
      priceMin: 0,
      priceMax: 200000,
      minRating: 0.0
    }
  });

  const response = http.post(
    ITINERARY_URL,
    body,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': data.authorization,
      },
      tags: {
        endpoint: 'itinerarios',
        name: 'POST /api/itineraries/proposals',
      },
    }
  );

  check(response, {
    'itinerarios: HTTP 201': (r) => r.status === 201,
    'itinerarios: respuesta JSON válida': (r) => {
      try {
        return r.json() !== null &&
          typeof r.json() === 'object';
      } catch (e) {
        return false;
      }
    },
  });

  sleep(THINK_TIME_S);
}