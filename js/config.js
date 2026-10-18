// Configuración del sitio.
//
// SHEET_ID: el código de la planilla de Google Sheets (lo que va entre /d/ y /edit en el link).
// La planilla tiene que estar compartida como "Cualquier persona con el enlace: Lector".
// Si queda vacío, o si Google no responde, el sitio usa la copia local data/calles.csv.
export const SHEET_ID = '1GfRQUZs_v026q9RT0hPR09zJtf94eYb_';
export const SHEET_NAME = 'Hoja 1';

// Categorías en el orden en que aparecen en la leyenda, con el color de cada una en el mapa.
export const CATEGORIAS = [
  { nombre: 'Político Nacional', etiqueta: 'Político nacional', color: '#FFD600' },
  { nombre: 'Militar Nacional', etiqueta: 'Militar nacional', color: '#795548' },
  { nombre: 'Batalla e Hito Nacional', etiqueta: 'Batalla e hito nacional', color: '#0288D1' },
  { nombre: 'Profesión Liberal', etiqueta: 'Profesión liberal', color: '#1A237E' },
  { nombre: 'Artista, Músico y Escritor', etiqueta: 'Artista, músico y escritor', color: '#A52714' },
  { nombre: 'Personalidad Internacional', etiqueta: 'Personalidad internacional', color: '#FF5252' },
  { nombre: 'Personalidad Local', etiqueta: 'Personalidad local', color: '#00897B' },
  { nombre: 'Clerical', etiqueta: 'Clerical', color: '#546E7A' },
  { nombre: 'Geografía, Provincia y Ciudad', etiqueta: 'Geografía, provincia y ciudad', color: '#817717' },
  { nombre: 'Flora y Fauna', etiqueta: 'Flora y fauna', color: '#E65100' },
  { nombre: 'Numerada', etiqueta: 'Numerada', color: '#9C27B0' },
  { nombre: 'Varios', etiqueta: 'Varios', color: '#000000' },
];
// Nombres viejos (en plural) que se siguen aceptando en la planilla.
export const ALIAS_CATEGORIA = {
  'Politico Nacional': 'Político Nacional', 'Militares Nacionales': 'Militar Nacional',
  'Batallas e Hitos Nacionales': 'Batalla e Hito Nacional', 'Profesiones Liberales': 'Profesión Liberal',
  'Artistas, Musicos y Escritores': 'Artista, Músico y Escritor', 'Personalidades Internacionales': 'Personalidad Internacional',
  'Geografia, Provincias y Ciudades': 'Geografía, Provincia y Ciudad', 'Numeradas': 'Numerada',
};
// Calles que no se muestran aunque estén en la planilla.
export const EXCLUIR = /^autopista/i;
export const SIN_CATEGORIA = { nombre: '', etiqueta: 'Sin categoría', color: '#9E9E9E' };

// Localidades oficiales del partido (los nombres que no estén acá se agrupan como están escritos).
export const LOCALIDADES = ['Quilmes', 'Quilmes Oeste', 'Bernal', 'Bernal Oeste', 'Don Bosco', 'Ezpeleta', 'Ezpeleta Oeste',
  'San Francisco Solano', 'Villa La Florida'];
export const ALIAS_LOCALIDAD = { 'Bernal Este': 'Bernal', 'bernal': 'Bernal' };

// Esquinas con historia (data/esquinas.json).
export const ESQUINA_ICONO = { rivalidad: '⚔️', amistad: '🤝', curiosa: '😄', historia: '✨' };
export const ESQUINA_TIPO = { rivalidad: 'Rivalidad', amistad: 'Amistad', curiosa: 'Curiosa', historia: 'Historia' };
