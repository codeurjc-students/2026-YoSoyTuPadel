# Proceso de Desarrollo y Calidad (CI/CD)

## Control de Calidad

### Pruebas Automáticas de Cliente y Servidor

#### Servidor (Backend Java)
* **Tipos de Pruebas:** Pruebas unitarias de controladores/servicios (JUnit 5, Mockito) e integración con base de datos mediante **Testcontainers** y **Selenium**.
* **Funcionalidades Probadas:**
  * **Entidad Racket (Palas):** Verificación de la consulta y obtención de la lista de palas desde la base de datos para su posterior renderizado en la interfaz gráfica.
* **Captura del resumen de la ejecución de las pruebas del backend (Tras ejecutar `mvn clean test`):**
  <img width="1252" height="287" alt="image" src="https://github.com/user-attachments/assets/a67d7dad-7e0d-483e-9b55-3c80c29e3572" />


#### Cliente (Frontend React)
* **Tipos de Pruebas:** Pruebas unitarias de componentes con **Vitest** y **React Testing Library**.
* **Funcionalidades Probadas:**
  * Renderizado del componente del catálogo de palas cargado desde el backend.
* **Captura del resumen de la ejecución de las pruebas del frontend (Tras ejecutar `npm run test`):**
  <img width="927" height="292" alt="image" src="https://github.com/user-attachments/assets/c7445772-d01d-4b98-93e0-9d43ec8ea0be" />

### Herramientas de Análisis Estático de Código
El análisis estático de código se realiza de manera automática mediante la integración de **SonarCloud** en el flujo de CI.
* Captura del resumen del análisis de código del proyecto en SonarCloud:
 <img width="761" height="457" alt="image" src="https://github.com/user-attachments/assets/22bc1f19-f33a-4fb3-9cd2-4aadb4834e0c" />

* Captura del resumen de métricas del tamaño del código, se ha utilizado la herramienta **cloc** (ejecutando `cloc . --exclude-dir=node_modules,target,.git,dist,build`):
<img width="647" height="422" alt="image" src="https://github.com/user-attachments/assets/f8aa11db-c6a6-4300-9986-c151f140b561" />

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
  <img width="1680" height="800" alt="image" src="https://github.com/user-attachments/assets/3e653d11-6d22-4fef-a58e-fc6c7a67addc" />


### Control de Versiones (GitHub)
El control de versiones del software se ha gestionado mediante **GitHub**, alojando el código en un repositorio de GitHub.

*   **Estrategia de Ramas:**
    *   `main`: Contiene el código en producción, siempre estable y listo para su despliegue.
    *   `develop`: Rama principal de integración donde se consolidan las nuevas funcionalidades probadas.
    *   `feature/*`: Ramas efímeras creadas para desarrollar una funcionalidad o issue específica (ej. `feature/racket-management`, `feature/user-auth`). Tras ser completadas y verificadas, se integran en `develop` mediante *Pull Requests* (PR).
    *   `fix/*`: Ramas destinadas a la corrección de errores.

*   **Métricas de uso de Git:**
    *   **Número total de commits:**
    *   **Número de ramas creadas:**
    *   **Pull Requests integradas:**

### Integración Continua (CI)
Se han automatizado los flujos de integración continua a través de **GitHub Actions** (`.github/workflows/ci-basic.yml`). El flujo se dispara automáticamente ante cada *push* o *Pull Request* hacia la rama  `main`, ejecutando los siguientes pasos:

1.  **Checkout & Setup:** Descarga del código fuente y configuración de los entornos de ejecución (**Java JDK 21** y **Node.js**).
2.  **Compilación y Tests de Backend:** Ejecución del comando Maven para validar la compilación y pasar la suite de pruebas unitarias y de integración.
3.  **Análisis Estático (SonarCloud):** Envío de las métricas de código, cobertura de tests y detección de vulnerabilidades (*code smells*, *security hotspots*) a la plataforma SonarCloud.
4.  **Verificación de Frontend:** Instalación de dependencias de React (`npm install`) y comprobación de la compilación de producción (`npm run build`).