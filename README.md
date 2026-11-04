# RIVIA · Checks del equipo

Facturación y beneficio de cada persona del equipo, con cada importe enlazado al documento de Holded que lo justifica.

## Cómo verlo

- Descarga el repositorio (botón **Code → Download ZIP**) y abre `index.html` en el navegador.
- Si está activado GitHub Pages, también se puede abrir desde la URL del sitio.
- Los enlaces a facturas, tickets y compras abren el documento en Holded. Hace falta tener sesión iniciada en Holded con la cuenta de RIVIA.

## Qué hay dentro

- **Personas**: resumen de cada persona. Al entrar, primero la base de Milkys (cerrados) y después la línea temporal de proyectos, documento a documento.
- **Proyectos**: todos los proyectos de Holded con su facturación, beneficio, fechas y reparto.
- **Cómo se calcula**: método y correcciones aplicadas sobre el resumen de Holded.

## Datos

- Fuente: documentos de Holded con proyecto en alguna línea (diciembre de 2023 a octubre de 2026), descargados el 02/11/2026.
- `data.js` contiene todos los datos. `app.js` y `style.css` son la web.
- Los totales coinciden con `RIVIA_Checks_por_persona.xlsx` y `RIVIA_Total_por_proyectos.xlsx`.
