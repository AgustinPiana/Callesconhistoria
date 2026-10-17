import { CATEGORIAS, SIN_CATEGORIA, LOCALIDADES, ESQUINA_ICONO, ESQUINA_TIPO } from './config.js';
import { norm } from './data.js';

// Rampa secuencial (azul, claro -> oscuro) para el mapa de calor.
const RAMPA = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];
const fmt = n => n.toLocaleString('es-AR');
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function el(tag, attrs = {}, ...hijos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e[k] = v;
    else e.setAttribute(k, v);
  }
  // null, false y 0 vienen de condiciones del tipo `lista.length && nodo`: no se dibujan.
  for (const h of hijos.flat(Infinity)) if (h != null && h !== false && h !== 0) e.append(h instanceof Node ? h : String(h));
  return e;
}

// Un único tooltip para todo el dashboard. El valor va primero y fuerte; la etiqueta, después.
const tip = el('div', { class: 'tip', role: 'tooltip' });
document.body.append(tip);
function conTooltip(nodo, valor, etiqueta) {
  const mostrar = ev => {
    tip.replaceChildren(el('strong', {}, valor), el('span', {}, etiqueta));
    tip.style.display = 'block';
    const r = nodo.getBoundingClientRect();
    const x = ev && ev.clientX ? ev.clientX : r.left + r.width / 2;
    const y = ev && ev.clientY ? ev.clientY : r.top;
    tip.style.left = Math.min(x + 12, innerWidth - tip.offsetWidth - 8) + 'px';
    tip.style.top = Math.max(y - tip.offsetHeight - 10, 8) + 'px';
  };
  const ocultar = () => { tip.style.display = 'none'; };
  nodo.addEventListener('pointermove', mostrar);
  nodo.addEventListener('pointerleave', ocultar);
  nodo.addEventListener('focus', () => mostrar());
  nodo.addEventListener('blur', ocultar);
  if (!nodo.hasAttribute('tabindex') && !/^(BUTTON|A)$/.test(nodo.tagName)) nodo.tabIndex = 0;
}

function tarjeta(titulo, subtitulo, ...cuerpo) {
  return el('section', { class: 'card' }, el('h3', {}, titulo), subtitulo && el('p', { class: 'sub' }, subtitulo), ...cuerpo);
}

export function crearDashboard(raiz, { calles, geo, esquinas, fuente }, acciones) {
  const total = calles.length;
  const personas = calles.filter(c => c.genero === 'Mujer' || c.genero === 'Hombre');
  const mujeres = personas.filter(c => c.genero === 'Mujer');
  const numeradas = calles.filter(c => c.grupo === 'Numeradas');
  const renombradas = calles.filter(c => /^cambi[oó] de nombre/i.test(c.origen));
  const porCat = new Map([...CATEGORIAS, SIN_CATEGORIA].map(c => [c.nombre, { cat: c, calles: [] }]));
  calles.forEach(c => porCat.get(c.grupo)?.calles.push(c));

  raiz.replaceChildren();

  // --- Cifra principal y KPIs
  raiz.append(el('div', { class: 'hero' },
    el('div', { class: 'hero-num' }, fmt(total)),
    el('div', { class: 'hero-txt' }, 'calles con nombre en el partido de Quilmes, clasificadas según a quién o a qué homenajean.')));
  const kpi = (valor, etiqueta, detalle) => el('div', { class: 'kpi' }, el('div', { class: 'kpi-v' }, valor), el('div', { class: 'kpi-l' }, etiqueta), detalle && el('div', { class: 'kpi-d' }, detalle));
  raiz.append(el('div', { class: 'kpis' },
    kpi(fmt(personas.length), 'homenajean a una persona', `${pct(personas.length, total)}% del total`),
    kpi(fmt(mujeres.length), 'llevan nombre de mujer', `${pct(mujeres.length, personas.length)}% de las personas`),
    kpi(fmt(numeradas.length), 'siguen siendo numeradas', `${pct(numeradas.length, total)}% del total`),
    renombradas.length ? kpi(fmt(renombradas.length), 'eran numeradas y hoy tienen nombre', 'según OpenStreetMap') : null));

  const grid = el('div', { class: 'grid' });
  raiz.append(grid);

  // --- Barras: calles por categoría (un solo color; la muestra al lado repite el color del mapa)
  const filasCat = [...porCat.values()].filter(x => x.calles.length).sort((a, b) => b.calles.length - a.calles.length);
  const max = filasCat[0]?.calles.length || 1;
  grid.append(tarjeta('Calles por categoría', 'Tocá una categoría para verla sola en el mapa.',
    el('div', { class: 'bars' }, filasCat.map(({ cat, calles: cs }) => {
      const fila = el('button', { type: 'button', class: 'bar-row', onclick: () => acciones.verCategoria(cat.nombre) },
        el('span', { class: 'bar-l' }, el('span', { class: 'sw' + (cat === SIN_CATEGORIA ? ' sw-dash' : ''), style: `background:${cat.color}` }), cat.etiqueta),
        el('span', { class: 'bar-track' }, el('span', { class: 'bar', style: `width:${(cs.length / max) * 100}%` })),
        el('span', { class: 'bar-v' }, fmt(cs.length)));
      conTooltip(fila, `${fmt(cs.length)} calles · ${pct(cs.length, total)}%`, cat.etiqueta);
      return fila;
    }))));

  // --- Mujeres y hombres (medidor)
  const hombres = personas.length - mujeres.length;
  grid.append(tarjeta('¿Mujeres u hombres?', `De las ${fmt(personas.length)} calles que homenajean a una persona.`,
    el('div', { class: 'meter-num' }, el('span', { class: 'big' }, `${pct(mujeres.length, personas.length)}%`), ' son mujeres'),
    el('div', { class: 'meter', role: 'img', 'aria-label': `${mujeres.length} mujeres y ${hombres} hombres` },
      el('span', { class: 'meter-fill', style: `width:${pct(mujeres.length, personas.length)}%` })),
    el('div', { class: 'meter-leg' }, el('span', {}, el('i', { class: 'k k-acc' }), `Mujeres: ${fmt(mujeres.length)}`), el('span', {}, el('i', { class: 'k k-trk' }), `Hombres: ${fmt(hombres)}`)),
    el('p', { class: 'nota' }, 'Algunas: ', mujeres.slice().sort(() => 0.5 - Math.random()).slice(0, 6).map(c => c.nombre.replace(/^(Avenida|Av\.|Pasaje|Doctora)\s+/, '')).join(', '), '…')));

  // --- Épocas (año de muerte)
  const bins = [['Antes de 1800', 0, 1799], ['1800–1849', 1800, 1849], ['1850–1899', 1850, 1899], ['1900–1949', 1900, 1949], ['1950–1999', 1950, 1999], ['2000 en adelante', 2000, 3000]];
  const conAnio = calles.filter(c => c.anio);
  const cuentas = bins.map(([l, a, b]) => [l, conAnio.filter(c => c.anio >= a && c.anio <= b).length]);
  const maxB = Math.max(1, ...cuentas.map(x => x[1]));
  grid.append(tarjeta('¿De qué época son?', `Año de muerte de los homenajeados (${fmt(conAnio.length)} calles con fecha cargada).`,
    el('div', { class: 'cols' }, cuentas.map(([l, n]) => {
      const col = el('div', { class: 'col' },
        el('div', { class: 'col-plot' }, el('span', { class: 'col-v' }, fmt(n)), el('span', { class: 'col-bar', style: `height:${(n / maxB) * 100}%` })),
        el('div', { class: 'col-l' }, l));
      conTooltip(col, `${fmt(n)} calles`, l);
      return col;
    }))));

  // --- Mapa de calor: qué porcentaje de cada localidad es de cada categoría
  const locs = LOCALIDADES.map(l => ({ l, calles: calles.filter(c => c.localidades.includes(l)) })).filter(x => x.calles.length);
  const cats = [...CATEGORIAS, SIN_CATEGORIA].filter(c => porCat.get(c.nombre).calles.length);
  const val = (loc, cat) => pct(loc.calles.filter(c => c.grupo === cat.nombre).length, loc.calles.length);
  const maxH = Math.max(1, ...locs.flatMap(lo => cats.map(ca => val(lo, ca))));
  const topDe = new Map(locs.map(lo => [lo.l, cats.reduce((a, b) => (val(lo, b) > val(lo, a) ? b : a))]));
  const heat = el('div', { class: 'heat', style: `grid-template-columns: minmax(150px,1.6fr) repeat(${locs.length}, minmax(34px,1fr))` },
    el('div', {}), locs.map(lo => el('div', { class: 'heat-h', title: lo.l }, el('span', {}, lo.l.replace('San Francisco Solano', 'Solano')))),
    cats.map(ca => [
      el('div', { class: 'heat-r' }, el('span', { class: 'sw' + (ca === SIN_CATEGORIA ? ' sw-dash' : ''), style: `background:${ca.color}` }), ca.etiqueta),
      locs.map(lo => {
        const v = val(lo, ca);
        const i = v ? Math.min(RAMPA.length - 1, Math.round((v / maxH) * (RAMPA.length - 1))) : -1;
        const celda = el('div', { class: 'heat-c', style: i >= 0 ? `background:${RAMPA[i]};color:${i >= 6 ? '#fff' : 'var(--ink)'}` : '' },
          topDe.get(lo.l) === ca ? `${v}%` : '');
        conTooltip(celda, `${v}% de las calles`, `${ca.etiqueta} en ${lo.l}`);
        return celda;
      }),
    ]));
  const tabla = el('table', { class: 'tbl tbl-heat', hidden: '' },
    el('thead', {}, el('tr', {}, el('th', {}, 'Categoría'), locs.map(lo => el('th', {}, lo.l)))),
    el('tbody', {}, cats.map(ca => el('tr', {}, el('th', {}, ca.etiqueta), locs.map(lo => el('td', {}, `${val(lo, ca)}%`))))));
  const toggle = el('button', { type: 'button', class: 'link', onclick: () => { const ver = tabla.hidden; tabla.hidden = !ver; heat.hidden = ver; toggle.textContent = ver ? 'Ver como gráfico' : 'Ver como tabla'; } }, 'Ver como tabla');
  grid.append(el('div', { class: 'span2' }, tarjeta('Cada barrio, su personalidad',
    'Qué porcentaje de las calles de cada localidad pertenece a cada categoría. El número marca la categoría que más pesa en cada una. Una calle que cruza dos localidades cuenta en las dos.',
    el('div', { class: 'heat-wrap' }, heat, tabla), toggle)));

  // --- Datos curiosos
  // Largo de una calle: el menor entre la suma de tramos (que cuenta doble las de dos manos) y la distancia
  // entre sus puntas (que exagera cuando hay calles homónimas separadas). La autopista no compite.
  const largo = c => Math.min(geo[c.indice].m, geo[c.indice].e ?? Infinity);
  const conGeo = calles.filter(c => geo[c.indice] && !/^autopista/i.test(c.nombre));
  const larga = conGeo.reduce((a, b) => (largo(b) > largo(a) ? b : a), conGeo[0]);
  const nombreLargo = calles.filter(c => c.grupo !== 'Numeradas').reduce((a, b) => (b.nombre.length > a.nombre.length ? b : a));
  const desap = calles.filter(c => /desaparecid/i.test(c.desc + ' ' + c.varios));
  const malvinas = calles.filter(c => /guerra de malvinas/i.test(c.desc));
  const genericas = new Set(['', 'calle numerada.', 'sin datos todavia.', 'arbol.', 'arbol frutal.', 'pais limitrofe.', 'pais centroamericano.', 'pais sudamericano.', 'presidente', 'provincia', 'bombero voluntario.', 'policia muerto en servicio.']);
  const porPersona = new Map();
  // Misma persona = mismo apellido (última palabra del nombre) y misma descripción.
  personas.forEach(c => {
    const d = norm(c.desc);
    if (genericas.has(d)) return;
    const k = norm(c.nombre).split(' ').pop() + '|' + d;
    porPersona.set(k, [...(porPersona.get(k) || []), c]);
  });
  const repetido = [...porPersona.values()].sort((a, b) => b.length - a.length)[0] || [];
  const locNum = locs.map(lo => [lo.l, pct(lo.calles.filter(c => c.grupo === 'Numeradas').length, lo.calles.length)]).sort((a, b) => b[1] - a[1])[0];
  const sinDatos = calles.filter(c => !c.grupo || !c.desc || /^sin datos/i.test(c.desc));
  const dato = (titulo, valor, texto, accion) => el('div', { class: 'dato' }, el('div', { class: 'dato-t' }, titulo), el('div', { class: 'dato-v' }, valor), el('p', {}, texto),
    accion && el('button', { type: 'button', class: 'link', onclick: accion }, 'Ver en el mapa'));
  grid.append(el('div', { class: 'span2' }, tarjeta('Datos curiosos', null, el('div', { class: 'datos' },
    larga && dato('La más larga', `${(largo(larga) / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} km`, `${larga.nombre} (sin contar la autopista).`, () => acciones.verCalle(larga.indice)),
    repetido.length > 1 && dato('El más homenajeado', `${repetido.length} calles`, `${repetido.map(c => c.nombre).join(', ')}.`, () => acciones.verCalle(repetido[0].indice)),
    dato('Nombre más largo', `${nombreLargo.nombre.length} letras`, `${nombreLargo.nombre}.`, () => acciones.verCalle(nombreLargo.indice)),
    desap.length && dato('Calles de la memoria', fmt(desap.length), 'calles llevan el nombre de desaparecidos durante las dictaduras.', () => acciones.verCategoria('Personalidad Local')),
    malvinas.length && dato('Malvinas', fmt(malvinas.length), 'calles homenajean a soldados quilmeños de la guerra de 1982.', null),
    locNum && dato('La más numerada', `${locNum[1]}%`, `de las calles de ${locNum[0]} todavía no tienen nombre propio.`, null),
    renombradas.length && dato('De número a nombre', fmt(renombradas.length), 'calles que en el relevamiento original eran numeradas ya tienen nombre según OpenStreetMap.', null),
    dato('Por completar', fmt(sinDatos.length), 'calles todavía sin categoría o sin descripción. ¿Sabés quiénes son?', null)))));

  // --- Esquinas con historia
  grid.append(el('div', { class: 'span2' }, tarjeta('Esquinas con historia', 'Cruces de calles reales donde se encuentran rivales, amigos o casualidades.',
    el('div', { class: 'esquinas' }, esquinas.map(e => el('article', { class: 'esquina' },
      el('div', { class: 'esq-ic', 'aria-hidden': 'true' }, ESQUINA_ICONO[e.tipo]),
      el('div', {}, el('div', { class: 'esq-tipo' }, ESQUINA_TIPO[e.tipo]), el('h4', {}, e.titulo), el('p', {}, e.texto),
        el('button', { type: 'button', class: 'link', onclick: () => acciones.verEsquina(e) }, 'Ver la esquina'))))))));

  // --- Tabla completa (también es la vista accesible de todos los datos)
  const filtro = el('input', { type: 'search', placeholder: 'Buscar por nombre o descripción…', 'aria-label': 'Buscar calle' });
  const selCat = el('select', { 'aria-label': 'Filtrar por categoría' }, el('option', { value: '*' }, 'Todas las categorías'),
    [...CATEGORIAS, SIN_CATEGORIA].map(c => el('option', { value: c.nombre }, c.etiqueta)));
  const cuerpo = el('tbody');
  const cuenta = el('span', { class: 'sub' });
  const pintar = () => {
    const t = norm(filtro.value), k = selCat.value;
    const fs = calles.filter(c => (k === '*' || c.grupo === k) && (!t || norm(c.nombre + ' ' + c.desc).includes(t)))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    cuenta.textContent = `${fmt(fs.length)} calles`;
    cuerpo.replaceChildren(...fs.map(c => el('tr', {},
      el('td', {}, geo[c.indice] ? el('button', { type: 'button', class: 'link', onclick: () => acciones.verCalle(c.indice) }, c.nombre) : c.nombre),
      el('td', {}, el('span', { class: 'sw' + (c.cat === SIN_CATEGORIA ? ' sw-dash' : ''), style: `background:${c.cat.color}` }), c.cat.etiqueta),
      el('td', {}, c.localidad), el('td', {}, c.desc))));
  };
  filtro.oninput = pintar;
  selCat.onchange = pintar;
  pintar();
  grid.append(el('div', { class: 'span2' }, tarjeta('Todas las calles', null,
    el('div', { class: 'filtros' }, filtro, selCat, cuenta),
    el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Calle'), el('th', {}, 'Categoría'), el('th', {}, 'Localidad'), el('th', {}, 'Quién o qué es'))), cuerpo)))));

  raiz.append(el('p', { class: 'fuente' }, fuente === 'sheets' ? 'Datos leídos en vivo de la planilla de Google Sheets.' : 'Datos de la copia local de la planilla.',
    ' Trazado de calles: © colaboradores de OpenStreetMap.'));
}
