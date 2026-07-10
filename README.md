# Dashboard iPhone Seminuevos

Dashboard interno para visualizar solicitudes de iPhones seminuevos de BaldeCash. Se conecta a la base de datos de produccion (lectura) y muestra las solicitudes agrupadas por modelo/color.

## Requisitos

- Node.js 18+
- Acceso a la base de datos (credenciales readonly)

## Instalacion

```bash
git clone https://github.com/miguelbaldecash/dashboard_iphone_seminuevo.git
cd dashboard_iphone_seminuevo
npm install
```

## Configuracion

Crear un archivo `.env` en la raiz del proyecto:

```
DB_HOST=databalde-cashsys.cloa3om0c8wi.us-west-2.rds.amazonaws.com
DB_NAME=databalde-cashsys
DB_USER=readonly_miguel_zavala
DB_PASS=<pedir contraseña al admin>
PORT=3000
```

## Uso

```bash
node server.js
```

Abrir http://localhost:3000 en el navegador.

## Funcionalidades

- Solicitudes agrupadas por modelo de iPhone
- Filtros por estado: Revisando, Aprobados, Rechazados, Firmados
- Busqueda por nombre o telefono
- Stock por modelo/color
- Link a Adminer por cada solicitud
- Auto-refresh cada 15 segundos
