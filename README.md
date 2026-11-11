# RIVIA · Checks del equipo

Facturación y beneficio de cada persona del equipo, con cada importe enlazado al documento de Holded que lo justifica.

## Cómo verlo

- Descarga el repositorio (botón **Code → Download ZIP**) y abre `index.html` en el navegador.
- Si está activado GitHub Pages, también se puede abrir desde la URL del sitio.
- Los enlaces a facturas, tickets y compras abren el documento en Holded. Hace falta tener sesión iniciada en Holded con la cuenta de RIVIA.

## Qué hay dentro

- **Personas**: resumen de cada persona. Al entrar, primero la base de Milkys (cerrados) y después la línea temporal de proyectos, documento a documento.
- **Objetivos**: avance de cada persona hacia 15.000 € de facturación (Milkys cuentan hasta 7.500 €) y 6.000 € de beneficio, lo que le falta, de dónde puede salir y el ritmo mensual hasta la fecha objetivo. La fecha objetivo se cambia en la propia página (por defecto, 30/06/2027).
- **Proyectos**: todos los proyectos de Holded con su facturación, beneficio, fechas y reparto.
- **Cómo se calcula**: método y correcciones aplicadas sobre el resumen de Holded.

## Datos

- Fuente: documentos de Holded con proyecto en alguna línea (diciembre de 2023 a octubre de 2026), descargados el 02/11/2026.
- `data.js` contiene todos los datos. `app.js` y `style.css` son la web.
- Los totales coinciden con `RIVIA_Checks_por_persona.xlsx` y `RIVIA_Total_por_proyectos.xlsx`.

## Auditoría (11/11/2026)

- **Auditoría** (`#/auditoria`): tres escenarios (Holded tal cual, auditado, peor caso de IVA), todas las líneas al 10 % en rojo con su recálculo al 21 %, líneas sin IVA o con IVA raro para el tipo de proyecto, posibles duplicados y la comparación proyecto a proyecto con los checkpoints y el PANEL DE CONTROL.
- **Repaso 1 a 1** (`#/repaso`): una persona por pantalla para la reunión. Flechas ← → del teclado para pasar, botón para marcar revisado (se guarda solo en tu navegador). Muestra objetivos (15.000 € de facturación, Milkys hasta 7.500 €; 6.000 € de beneficio) en los cuatro escenarios: Excel del equipo (TOTAL 2), Holded, auditado y peor caso.
- Datos en `audit.js`. Excel de la auditoría: `RIVIA_Auditoria_checks.xlsx` (fuera del repo).
- ⚠ El tipo de IVA de cada línea hay que confirmarlo con la gestoría. Nada se ha cambiado en Holded.
