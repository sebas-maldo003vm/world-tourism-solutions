// pruebas-carga/k6/businesses.js
// Pruebas de carga (nivel 1): solo lecturas públicas, sin autenticación.
//   1) GET /api/businesses?lat&lng&radiusKm   (consulta espacial PostGIS)
//   2) GET /api/businesses                    (línea base: listado sin filtro)
//   3) GET /api/businesses/{id}               (línea base: lectura puntual)
//
// Variables de entorno (-e NOMBRE=valor):
//   BASE_URL     URL base
//   PERFIL       smoke | carga (por defecto smoke)
//   VUS          usuarios virtuales pico en el perfil carga (por defecto 5)
//   THINK_TIME_S pausa entre peticiones de un usuario, en segundos (por defecto 1)
//   BUSINESS_IDS ids de negocios para el detalle, separados por coma
//   CONFIRMO_CARGA_ALTA=si   obligatorio para VUS > 10

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (
  __ENV.BASE_URL || 'https://world-tourism-solutions.onrender.com'
).replace(/\/$/, '');
const API = `${BASE_URL}/api/businesses`;
const PERFIL = __ENV.PERFIL || 'smoke';
const VUS = parseInt(__ENV.VUS || '5', 10);
const THINK_TIME_S = parseFloat(__ENV.THINK_TIME_S || '1');
const IDS = (__ENV.BUSINESS_IDS ||
  '16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,50,51')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (PERFIL !== 'smoke' && PERFIL !== 'carga') {
  throw new Error(`PERFIL inválido: "${PERFIL}". Usa smoke o carga.`);
}
if (PERFIL === 'carga' && VUS > 10 && __ENV.CONFIRMO_CARGA_ALTA !== 'si') {
  throw new Error(
    'VUS > 10 requiere autorización explícita: agrega -e CONFIRMO_CARGA_ALTA=si',
  );
}

// Orígenes tomados de las coordenadas reales de tus datos de prueba.
const ORIGENES = [
  { ciudad: 'Bogota', lat: 4.711, lng: -74.0721 },
  { ciudad: 'Villavicencio', lat: 4.1114595, lng: -73.4967836 },
  { ciudad: 'Medellin', lat: 6.2697324, lng: -75.6025597 },
  { ciudad: 'Paipa', lat: 5.7812701, lng: -73.1176532 },
];
const RADIOS_KM = [5, 25, 50];

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Cada endpoint corre en su propio escenario, uno después de otro, con el
// mismo perfil de carga, para poder compararlos sin que se mezclen.
function rampa(exec, startTime) {
  return {
    executor: 'ramping-vus',
    exec,
    startTime,
    startVUs: 0,
    stages: [
      { duration: '15s', target: VUS }, // subida gradual
      { duration: '60s', target: VUS }, // carga sostenida
      { duration: '10s', target: 0 }, // bajada
    ],
    gracefulRampDown: '10s',
    gracefulStop: '10s',
  };
}

function humo(exec, startTime) {
  return {
    executor: 'per-vu-iterations',
    exec,
    startTime,
    vus: 1,
    iterations: 5,
    maxDuration: '10s',
  };
}

const escenarios =
  PERFIL === 'smoke'
    ? {
        espacial: humo('espacial', '0s'),
        listado: humo('listado', '10s'),
        detalle: humo('detalle', '20s'),
      }
    : {
        espacial: rampa('espacial', '0s'),
        listado: rampa('listado', '110s'),
        detalle: rampa('detalle', '220s'),
      };

export const options = {
  scenarios: escenarios,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  thresholds: {
    // PROVISIONALES: no son objetivos del profesor ni de la aplicación.
    // Se ajustarán después de ver la primera corrida real.
    'http_req_failed{endpoint:espacial}': ['rate<0.01'],
    'http_req_failed{endpoint:listado}': ['rate<0.01'],
    'http_req_failed{endpoint:detalle}': ['rate<0.01'],
    'http_req_duration{endpoint:espacial}': ['p(95)<1000'],
    'http_req_duration{endpoint:listado}': ['p(95)<1000'],
    'http_req_duration{endpoint:detalle}': ['p(95)<800'],
    checks: ['rate>0.99'],
  },
};

// Calentamiento (JIT, pool de conexiones). Va con tag "warmup" para que
// no entre en las métricas de los endpoints.
export function setup() {
  for (let i = 0; i < 3; i++) {
    http.get(API, { tags: { endpoint: 'warmup', name: 'warmup' } });
    http.get(`${API}?lat=4.711&lng=-74.0721&radiusKm=25`, {
      tags: { endpoint: 'warmup', name: 'warmup' },
    });
  }
}

function esArreglo(res) {
  try {
    return Array.isArray(res.json());
  } catch (e) {
    return false;
  }
}

export function espacial() {
  const o = elegir(ORIGENES);
  const radio = elegir(RADIOS_KM);
  const res = http.get(`${API}?lat=${o.lat}&lng=${o.lng}&radiusKm=${radio}`, {
    tags: { endpoint: 'espacial', name: 'GET /api/businesses?lat&lng&radiusKm' },
  });
  check(res, {
    'espacial: status 200': (r) => r.status === 200,
    'espacial: respuesta es un arreglo JSON': esArreglo,
  });
  sleep(THINK_TIME_S);
}

export function listado() {
  const res = http.get(API, {
    tags: { endpoint: 'listado', name: 'GET /api/businesses' },
  });
  check(res, {
    'listado: status 200': (r) => r.status === 200,
    'listado: respuesta es un arreglo JSON': esArreglo,
  });
  sleep(THINK_TIME_S);
}

export function detalle() {
  const id = elegir(IDS);
  const res = http.get(`${API}/${id}`, {
    tags: { endpoint: 'detalle', name: 'GET /api/businesses/{id}' },
  });
  check(res, {
    'detalle: status 200': (r) => r.status === 200,
    'detalle: el id coincide': (r) => {
      try {
        return String(r.json('id')) === String(id);
      } catch (e) {
        return false;
      }
    },
  });
  sleep(THINK_TIME_S);
}