# Proceso de Desarrollo y Calidad (CI/CD)

## Control de Calidad

### Pruebas Automáticas de Cliente y Servidor

#### Servidor (Backend Java)
* **Tipos de Pruebas:** Pruebas unitarias y de integración de API (JUnit 5, Mockito, MockMvc). Se incluyen validaciones *End-to-End* mediante navegador para los flujos principales. Se utilizan bases de datos efímeras (**Testcontainers**) para garantizar el aislamiento del estado en las pruebas de persistencia.* **Funcionalidades Probadas:**
  * **Arranque y Configuración:** Validación de la carga correcta del contexto de Spring Boot.
  * **Autenticación y Usuarios:** Verificación de creación, edición (control de emails duplicados), borrado y login de usuarios/entrenadores. Comprobación de roles y revocación de tokens tras el cambio de correo electrónico. Integración de login de administradores con redirección.
  * **Reservas (Bookings):** Validación exhaustiva de la lógica de negocio para partidos y entrenamientos. Se impide reservar franjas pasadas, pistas cerradas, colisiones de horarios (tanto de pistas como de entrenadores) o peticiones sin autenticación. Verificación del filtrado, cancelación lógica, y la conversión automática de estado al transcurrir el horario establecido.
  * **Catálogo de Pistas (Courts):** Pruebas de obtención paginada, gestión de respuestas HTTP (404 para pistas inexistentes), creación, edición de precios, y validación de las cabeceras de paginación (`size`, `page`).
  * **Gestión de Material (Rackets):** Verificación del CRUD del catálogo, control concurrente del stock durante el alquiler, asociación/desvinculación con usuarios, manejo y procesamiento de imágenes (PNG, JPEG, GIF, WebP).
  * **Pruebas de Sistema:** Validación de respuesta de las APIs para catálogos y flujos de navegador que simulan la selección de franjas horarias y el alquiler de material.
    
* **Captura del resumen de la ejecución de las pruebas del backend (Tras ejecutar `mvn clean test`):**

  <img width="1247" height="432" alt="image" src="https://github.com/user-attachments/assets/feee3aa5-df3e-4648-8bd8-ce18cd52e92f" />


#### Cliente (Frontend React)
* **Tipos de Pruebas:** Pruebas unitarias de componentes aislados y pruebas de integración de flujos completos (con inyección de contextos) utilizando **Vitest** y **React Testing Library**. Se emplea el uso de *FakeTimers* para fijar el reloj del sistema y hacer las pruebas temporales deterministas.
* **Funcionalidades Probadas:**
  * **Enrutado y Autorización:** Validación de la restricción de rutas privadas (redirección a `/403` por falta de permisos o al Login por falta de sesión), control de acceso a paneles administrativos y visualización del layout general.
  * **Autenticación:** Comprobación del ciclo de vida del *AuthContext*, manejo del formulario de registro/login, propagación de errores HTTP convertidos a mensajes amigables, confirmación de cierre de sesión y bloqueo de hooks fuera de contexto.
  * **Catálogo e Integración de Reservas:** Simulación del recorrido desde la visualización de pistas paginadas hasta la selección de horario. Se valida el bloqueo visual de horas pasadas o ya reservadas, y la gestión de conflictos devueltos por el servidor mostrando un error unificado en el modal de confirmación.
  * **Gestión de Entrenadores:** Prueba de carga de listados con nivel FEP, reserva de bloques de dos horas y deshabilitación de franjas en colisión. Verificación de las pestañas exclusivas del panel del entrenador (citas pendientes vs clientes finalizados).
  * **Historial y Material (Mi Perfil):** Comprobación de la separación de reservas (pendientes/finalizadas) con sus lógicas de paginación y ordenamiento independientes. Validación del flujo de alquiler de palas: deshabilitación de botones sin stock, deduplicación en el historial e intercepción de alquileres redundantes redirigiendo al usuario a su inventario actual.
  * **Panel de Administración:** Verificación de permisos de edición avanzada, creación de pistas, subida de imágenes de material y cancelación forzosa de reservas ajenas.
    
* **Captura del resumen de la ejecución de las pruebas del frontend (Tras ejecutar `npm run test`):**
  
  <img width="850" height="156" alt="image" src="https://github.com/user-attachments/assets/cc97dbf8-2914-44c7-b74c-1cfee53f26aa" />


### Herramientas de Análisis Estático de Código
El análisis estático de código se realiza de manera automática mediante la integración de **SonarCloud** en el flujo de CI, analizando el backend y el frontend por separado.

* Captura del resumen del análisis de código del proyecto en SonarCloud (Backend):

 <img width="1382" height="586" alt="image" src="https://github.com/user-attachments/assets/b5abf346-b0b3-447c-93c4-bc871511e3bc" />


* Captura del resumen del análisis de código del proyecto en SonarCloud (Frontend):
  
 <img width="1387" height="590" alt="image" src="https://github.com/user-attachments/assets/fc3f10f7-faa3-4552-9a23-241b1aa908ab" />


* Captura del resumen de métricas del tamaño del código, se ha utilizado la herramienta **cloc** (ejecutando `cloc . --exclude-dir=node_modules,target,.git,dist,build`):
  
  <img width="650" height="472" alt="image" src="https://github.com/user-attachments/assets/db17a3f5-f7d1-4263-8fea-bc84455f6de1" />


## Proceso de Desarrollo

### Gestión de Tareas
Para la organización y seguimiento del trabajo se han utilizado las herramientas nativas de **GitHub**:

*   **GitHub Issues:** Cada nueva funcionalidad, corrección de errores (*bugs*) o tarea técnica se registra como una *Issue* independiente. Las tareas se categorizan mediante etiquetas (*labels*) como `enhancement`, `bug`, `documentation` o `testing`.
*   **GitHub Projects & Tablero Kanban:** La gestión visual del trabajo se apoya en la herramienta **GitHub Projects**. Se ha implementado un tablero Kanban adaptado con un flujo de trabajo de 5 estados para reflejar el ciclo de vida real de cada tarea:

    *   **`Backlog`:** Tareas pendientes identificadas que aún no han sido priorizadas para su realización.
    *   **`Ready`:** Tareas preparadas, refinadas y especificadas, listas para ser tomadas por el desarrollador.
    *   **`In progress`:** Tareas que se están desarrollando activamente en el momento actual.
    *   **`In review`:** Tareas cuyo código está completado y se encuentran en fase de revisión de código.
    *   **`Done`:** Funcionalidades e *issues* completamente finalizadas, validadas e integradas en la rama principal.

* **Captura del tablero Kanban en GitHub Projects realizado hasta el momento:**
  <img width="1890" height="860" alt="image" src="https://github.com/user-attachments/assets/8145224c-a7e7-46b5-8cc7-1fa3b62afe86" />


### Control de Versiones (GitHub)
El control de versiones del software se ha gestionado mediante **GitHub**, alojando el código en un repositorio de GitHub.

*   **Estrategia de Ramas:**
    *   `main`: Contiene el código en producción, siempre estable y listo para su despliegue.
    *   `develop`: Rama principal de integración donde se consolidan las nuevas funcionalidades probadas.
    *   `feature/*`: Ramas efímeras creadas para desarrollar una funcionalidad o issue específica (ej. `feature/admin-usages`). Tras ser completadas y verificadas, se integran en `develop` mediante *Pull Requests* (PR).
    *   `fix/*`: Ramas destinadas a la corrección de errores.

*   **Métricas de uso de Git:**
    *   **Número total de commits:** 195
    *   **Número de ramas creadas:** 25
    *   **Pull Requests integradas:** 24

### Integración Continua (CI)
Se han automatizado los flujos de integración continua a través de **GitHub Actions** (`.github/workflows/ci-basic.yml`). El flujo se dispara automáticamente ante cada *push* o *Pull Request* hacia la rama  `main`, ejecutando los siguientes pasos:

1.  **Checkout & Setup:** Descarga del código fuente y configuración de los entornos de ejecución (**Java JDK 21** y **Node.js**).
2.  **Compilación y Tests de Backend:** Ejecución del comando Maven para validar la compilación y pasar la suite de pruebas unitarias y de integración.
3.  **Análisis Estático (SonarCloud):** Envío de las métricas de código, cobertura de tests y detección de vulnerabilidades (*code smells*, *security hotspots*) a la plataforma SonarCloud.
4.  **Verificación de Frontend:** Instalación de dependencias de React (`npm install`) y comprobación de la compilación de producción (`npm run build`).

### Entrega Continua (CD) y Despliegue
Se ha implementado un sistema de entrega continua sin duplicación de código mediante el uso de *Workflows Reutilizables* en GitHub Actions (`reusable-deploy.yml` y `main-ci-cd.yml`):
* Cada vez que se integra código en la rama `main`, se genera y publica automáticamente una imagen Docker y el artefacto OCI del `docker-compose.yml` etiquetados con el tag `dev`.
* Al realizar una release en GitHub, se etiquetan automáticamente los artefactos con la versión de la release y se actualiza el tag `latest`.
* Se permite la generación de *builds* manuales partiendo de cualquier rama mediante el trigger `workflow_dispatch`.

### Versionado
El procedimiento de lanzamiento de versiones se realiza coordinando el código fuente con las releases de GitHub.
1. Se actualizan los ficheros `pom.xml`, `package.json` y `docker-compose.yml` para coincidir con la versión de la release.
2. Se publica la Release oficial en GitHub.
3. Se actualiza nuevamente la rama principal a la siguiente versión iterativa en desarrollo (añadiendo el sufijo `-SNAPSHOT` en Maven).

**Historial de Versiones:**
* **v0.1 (10 de Octubre de 2026):** Versión inicial de la arquitectura. Incluye las operaciones CRUD de todas las entidades e implementación de todo el pipeline CI/CD.
