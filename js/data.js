import { SHEET_ID, SHEET_NAME, CATEGORIAS, SIN_CATEGORIA, ALIAS_CATEGORIA, ALIAS_LOCALIDAD, EXCLUIR } from './config.js';

// CSV mínimo con comillas y saltos de línea dentro de campos.
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map(h => h.trim());
  return rows.filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const CAT = Object.fromEntries(CATEGORIAS.map(c => [norm(c.nombre), c]));
for (const [viejo, nuevo] of Object.entries(ALIAS_CATEGORIA)) CAT[norm(viejo)] = CAT[norm(nuevo)];
export function norm(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
export const categoria = nombre => CAT[norm(nombre)] || SIN_CATEGORIA;

export function localidades(texto) {
  return String(texto || '').split(/,\s*|\s+y\s+/).map(s => s.trim()).filter(Boolean)
    .map(s => ALIAS_LOCALIDAD[s] || s).filter(s => s !== 'Fuera del partido');
}

export function anio(fecha) {
  const m = String(fecha || '').match(/\b(1[5-9]\d\d|20\d\d)\b/);
  return m ? +m[1] : null;
}

function limpiar(r) {
  const cat = categoria(r['Grupo']);
  return {
    indice: parseInt(r['Indice'], 10),
    nombre: r['Nombre'],
    grupo: cat.nombre,
    cat,
    fecha: r['Fecha de muerte'] === '-' ? '' : r['Fecha de muerte'],
    anio: anio(r['Fecha de muerte']),
    localidad: r['Localidad'],
    localidades: localidades(r['Localidad']),
    varios: r['Varios'],
    desc: r['Descripción'] || r['Descripcion'] || '',
    genero: r['Género'] || r['Genero'] || '',
    origen: r['Origen'] || '',
  };
}

async function texto(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// Devuelve { calles, fuente }. Intenta Google Sheets y, si falla, la copia local.
// El género sale de la columna "Género" de la planilla si existe; si no, de data/genero.json (por Indice).
export async function cargarCalles() {
  const genero = await cargarJSON('data/genero.json').catch(() => ({}));
  const preparar = filas => filas.map(limpiar).filter(c => c.nombre && !EXCLUIR.test(c.nombre))
    .map(c => (c.genero ? c : { ...c, genero: genero[c.indice] || '' }));
  if (SHEET_ID) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
      const filas = parseCSV(await texto(url));
      if (filas.length && 'Nombre' in filas[0]) return { calles: preparar(filas), fuente: 'sheets' };
    } catch (e) {
      console.warn('No se pudo leer Google Sheets, uso la copia local.', e);
    }
  }
  return { calles: preparar(parseCSV(await texto('data/calles.csv'))), fuente: 'local' };
}

export async function cargarJSON(url) {
  return JSON.parse(await texto(url));
}
