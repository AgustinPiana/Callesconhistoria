import { cargarCalles, cargarJSON } from './data.js';
import { crearMapa } from './map.js';
import { crearDashboard } from './dashboard.js';

const vistas = { mapa: document.getElementById('vista-mapa'), datos: document.getElementById('vista-datos') };
let mapa;

function mostrar(nombre) {
  if (!vistas[nombre]) nombre = 'mapa';
  for (const [k, v] of Object.entries(vistas)) v.hidden = k !== nombre;
  document.querySelectorAll('.tabs a').forEach(a => a.setAttribute('aria-current', a.hash === '#' + nombre ? 'page' : 'false'));
  if (nombre === 'mapa' && mapa) mapa.refrescar();
  if (nombre === 'datos') window.scrollTo(0, 0);
}
const irAlMapa = () => { if (location.hash !== '#mapa') location.hash = 'mapa'; else mostrar('mapa'); };
window.addEventListener('hashchange', () => mostrar(location.hash.slice(1)));

try {
  const [{ calles, fuente }, geo, esquinas, limite] = await Promise.all([cargarCalles(), cargarJSON('data/geometria.json'),
    cargarJSON('data/esquinas.json'), cargarJSON('data/limite.json').catch(() => null)]);
  mostrar(location.hash.slice(1) || 'mapa');
  mapa = crearMapa({ calles, geo, esquinas, limite });
  crearDashboard(document.getElementById('dashboard'), { calles, geo, esquinas, fuente }, {
    verCategoria: nombre => { irAlMapa(); mapa.soloCategoria(nombre); },
    verCalle: indice => { irAlMapa(); setTimeout(() => mapa.irACalle(indice), 50); },
    verEsquina: e => { irAlMapa(); setTimeout(() => mapa.irAEsquina(e), 50); },
  });
} catch (e) {
  console.error(e);
  document.getElementById('error').hidden = false;
} finally {
  document.body.classList.remove('cargando');
}
