# Ejecución y Despliegue de la Aplicación

## Requisitos Previos
Para ejecutar la aplicación localmente mediante contenedores, es necesario contar con la infraestructura de Docker:
* **Windows y Mac:** Es necesario instalar [Docker Desktop](https://www.docker.com/products/docker-desktop/).
* **Linux:** Es necesario instalar el motor de [Docker](https://docs.docker.com/engine/install/) y el plugin [Docker Compose](https://docs.docker.com/compose/install/).

## Instrucciones de Ejecución mediante Artefacto OCI

La aplicación se distribuye empaquetada. Para ejecutarla partiendo del `docker-compose.yml` publicado en DockerHub:

1. Instala la herramienta ORAS CLI en tu sistema.
2. Descarga el fichero de composición ejecutando en tu terminal:
   
   ```bash
   oras pull registry-1.docker.io/vcandel/yosoytupadel-compose:latest
    ```

3. Una vez descargado el archivo, levanta los servicios (base de datos y aplicación) con la configuración por defecto:
   
    ```bash
    docker compose up -d
    ```

### Gestión de Versiones Específicas
* **Ejecutar la última versión disponible:** Utiliza el tag `:latest` en el comando ORAS (como en el paso anterior) y asegúrate de que el compose apunte a la imagen `latest`.
* **Ejecutar una versión específica (ej. 0.1):** Utiliza el tag de la versión concreta:
  
    ```bash
    oras pull registry-1.docker.io/vcandel/yosoytupadel-compose:0.1
    ```
    
### Datos de Prueba vs Base de Datos Vacía
* **Con datos de prueba:** Por defecto, la aplicación está configurada para arrancar insertando datos de ejemplo (`app.load-sample-data=true`), lo que facilita las pruebas iniciales con pistas generadas, usuarios creados y el catálogo lleno.
* **Sin modificar la base de datos (Entorno limpio):** Para iniciar la aplicación sin precargar estos datos, edita el archivo `docker-compose.yml` que has descargado y añade la siguiente variable de entorno en la sección del contenedor de la aplicación (backend) para deshabilitar la inicialización:

    ```text
    environment:
      - APP_LOAD_SAMPLE_DATA=false
    ```
    
## Acceso a la Aplicación
Una vez iniciados los contenedores, accede mediante tu navegador web a: `http://localhost:443`.

**Credenciales de los datos de ejemplo:**
* **Administrador:** Email: `admin@yosoytupadel.com` / Contraseña: `admin`
* **Entrenador:** Email: `coach@yosoytupadel.com` / Contraseña: `coach`
* **Alumno:** Email: `victor@alumno.com` / Contraseña: `pass`
