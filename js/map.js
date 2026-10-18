/* global L */
import { CATEGORIAS, SIN_CATEGORIA, ESQUINA_ICONO } from './config.js';
import { norm } from './data.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function crearMapa({ calles, geo, esquinas, limite }) {
  const map = L.map('map', { preferCanvas: true, zoomControl: true }).setView([-34.745, -58.28], 13);
  // Mosaicos estándar de OpenStreetMap, en gris (ver .base-gris en el CSS) para que resalten los colores de las calles.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, className: 'base-gris',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>',
  }).addTo(map);

  // Tapa todo lo que queda fuera del partido (incluidos los nombres de los municipios vecinos) y marca el borde.
  if (limite?.length) {
    const mundo = [[-90, -180], [-90, 180], [90, 180], [90, -180]];
    L.polygon([mundo, limite], { stroke: false, fillColor: '#f2f2ef', fillOpacity: 1, interactive: false, className: 'fuera' }).addTo(map);
    L.polygon(limite, { color: '#52514e', weight: 1.5, fill: false, interactive: false }).addTo(map);
    map.setMaxBounds(L.latLngBounds(limite).pad(0.6));
  }

  const visibles = new Set([...CATEGORIAS.map(c => c.nombre), SIN_CATEGORIA.nombre]);
  const capas = [];
  for (const c of calles) {
    const g = geo[c.indice];
    if (!g) continue;
    const sinCat = !c.grupo;
    const l = L.polyline(g.c.map(line => line.map(([x, y]) => [y, x])), {
      color: c.cat.color, weight: sinCat ? 3 : 4, opacity: 0.9, dashArray: sinCat ? '4 4' : null,
    });
    l.calle = c;
    l.bindTooltip(`<b>${esc(c.nombre)}</b>${c.desc ? '<br>' + esc(c.desc) : ''}`, { sticky: true, className: 'tt' });
    l.bindPopup(() => ficha(c));
    l.on('mouseover', () => l.setStyle({ weight: 7 }));
    l.on('mouseout', () => l.setStyle({ weight: sinCat ? 3 : 4 }));
    l.addTo(map);
    capas.push(l);
  }
  if (capas.length) map.fitBounds(L.featureGroup(capas).getBounds());

  const esqLayer = L.layerGroup(esquinas.map(e => L.marker([e.lat, e.lng], {
    icon: L.divIcon({ className: 'esq', html: ESQUINA_ICONO[e.tipo], iconSize: [26, 26], iconAnchor: [13, 13] }),
    zIndexOffset: 1000, title: e.titulo,
  }).bindTooltip(esc(e.titulo), { direction: 'top', offset: [0, -10] })
    .bindPopup(`<div class="pop"><b>${ESQUINA_ICONO[e.tipo]} ${esc(e.titulo)}</b><p>${esc(e.texto)}</p></div>`))).addTo(map);

  function aplicar() {
    for (const l of capas) {
      const on = visibles.has(l.calle.grupo);
      if (on && !map.hasLayer(l)) l.addTo(map);
      if (!on && map.hasLayer(l)) map.removeLayer(l);
    }
    document.querySelectorAll('#leyenda [data-cat]').forEach(el => {
      el.setAttribute('aria-pressed', String(visibles.has(el.dataset.cat)));
    });
  }

  // Leyenda con conteo, que además funciona como filtro.
  const conteo = {};
  calles.forEach(c => { if (geo[c.indice]) conteo[c.grupo] = (conteo[c.grupo] || 0) + 1; });
  const ley = document.getElementById('leyenda');
  for (const c of [...CATEGORIAS, SIN_CATEGORIA]) {
    if (!conteo[c.nombre]) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cat';
    b.dataset.cat = c.nombre;
    b.setAttribute('aria-pressed', 'true');
    const sw = document.createElement('span');
    sw.className = 'sw' + (c === SIN_CATEGORIA ? ' sw-dash' : '');
    sw.style.background = c.color;
    const t = document.createElement('span');
    t.textContent = c.etiqueta;
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = conteo[c.nombre];
    b.append(sw, t, n);
    b.onclick = () => { visibles.has(c.nombre) ? visibles.delete(c.nombre) : visibles.add(c.nombre); aplicar(); };
    ley.append(b);
  }
  document.getElementById('todas').onclick = () => { [...CATEGORIAS, SIN_CATEGORIA].forEach(c => visibles.add(c.nombre)); aplicar(); };
  document.getElementById('ninguna').onclick = () => { visibles.clear(); aplicar(); };
  document.getElementById('ver-esquinas').onchange = e => e.target.checked ? esqLayer.addTo(map) : map.removeLayer(esqLayer);

  // Buscador.
  const q = document.getElementById('buscar'), res = document.getElementById('resultados');
  q.oninput = () => {
    const t = norm(q.value);
    res.replaceChildren();
    if (t.length < 2) return;
    const hits = capas.filter(l => norm(l.calle.nombre).includes(t)).slice(0, 10);
    if (!hits.length) { const d = document.createElement('div'); d.className = 'vacio'; d.textContent = 'Sin resultados'; res.append(d); return; }
    for (const l of hits) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = l.calle.nombre;
      b.onclick = () => irA(l);
      res.append(b);
    }
  };

  function irA(l) {
    if (!visibles.has(l.calle.grupo)) { visibles.add(l.calle.grupo); aplicar(); }
    map.fitBounds(l.getBounds(), { maxZoom: 17 });
    l.openPopup(l.getCenter());
  }

  return {
    map,
    soloCategoria(nombre) { visibles.clear(); visibles.add(nombre); aplicar(); },
    irACalle(indice) { const l = capas.find(x => x.calle.indice === indice); if (l) irA(l); },
    irAEsquina(e) { map.setView([e.lat, e.lng], 17); esqLayer.eachLayer(m => { const p = m.getLatLng(); if (p.lat === e.lat && p.lng === e.lng) m.openPopup(); }); },
    refrescar() { map.invalidateSize(); },
  };
}

function ficha(c) {
  const meta = [c.localidad, c.fecha && `† ${c.fecha}`].filter(Boolean).map(esc).join(' · ');
  return `<div class="pop"><b>${esc(c.nombre)}</b>
    <div class="pop-cat"><span class="sw" style="background:${c.cat.color}"></span>${esc(c.cat.etiqueta)}</div>
    ${c.desc ? `<p>${esc(c.desc)}</p>` : ''}
    ${meta ? `<div class="m">${meta}</div>` : ''}</div>`;
}
