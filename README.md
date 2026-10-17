# QACLLES · Las calles de Quilmes

Mapa y datos de las calles del partido de Quilmes según a quién o a qué homenajea su nombre.

Sitio estático (HTML + JavaScript, sin compilación). Se publica en Vercel tal cual.

## Cómo se actualizan los datos

- **Planilla (categorías, descripciones, fechas, etc.)**: se lee en vivo de Google Sheets.
  El código de la planilla va en `js/config.js` (`SHEET_ID`). La planilla tiene que estar
  compartida como "Cualquier persona con el enlace: Lector".
  Si Google no responde, el sitio usa la copia `data/calles.csv`.
- **Trazado de las calles**: `data/geometria.json`, sacado de OpenStreetMap. Se une a la
  planilla por la columna **Indice**: no cambies ni reutilices esos números.
- **Esquinas con historia**: `data/esquinas.json`.

Columnas que usa el sitio: Indice, Nombre, Grupo, Fecha de muerte, Localidad, Varios,
Descripción, Género (Mujer / Hombre / Colectivo / vacío), Origen.

## Probar en la computadora

    python -m http.server 8000

y abrir http://localhost:8000
