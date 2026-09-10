# Guía de Desarrollo y Arquitectura

La aplicación web **YoSoyTuPadel** sigue una arquitectura **SPA (Single Page Application)** desacoplada, donde la interfaz gráfica se ejecuta de forma íntegra en el navegador web del usuario y se comunica asíncronamente con el servidor mediante peticiones HTTP a una API REST. Esta arquitectura permite separar estrictamente la lógica de presentación de la lógica de negocio. El sistema está compuesto por tres partes fundamentales:
1. **Cliente:** Aplicación web SPA en React que gestiona la vista y la lógica de presentación.
2. **Servidor:** API REST monolítica desarrollada en Java con Spring Boot que procesa las reglas de negocio, la lógica de reservas, autenticación y gestión de catálogo.
3. **Base de Datos:** Sistema relacional MySQL encargado de la persistencia de los datos del sistema.

### Resumen de la Arquitectura y Proceso de Desarrollo

| Dimensión | Descripción |
| :--- | :--- |
| **Tipo** | Aplicación Web SPA desacoplada con API REST Backend |
| **Tecnologías** | Java 21, Spring Boot 4.0.7, React, TypeScript, Node.js, MySQL |
| **Herramientas** | IntelliJ IDEA, Docker Desktop, Postman, GitHub |
| **Control de Calidad** | Tests unitarios (JUnit 5, Vitest), Testcontainers, Selenium, SonarCloud, GitHub Actions |
| **Proceso de Desarrollo** | Iterativo e incremental apoyado en prácticas de Kanban, Git y CI/CD |

## Tecnologías

A continuación se listan las tecnologías requeridas para la ejecución de la aplicación web:

* **[Java 21](https://www.oracle.com/java/):** Lenguaje de programación principal orientado a objetos utilizado en el backend para implementar la lógica de dominio y los servicios de negocio.
* **[Spring Boot 4.0.7](https://spring.io/projects/spring-boot):** Framework Java que simplifica la creación de aplicaciones web desacopladas, gestionando la inyección de dependencias, la persistencia JPA/Hibernate y la exposición de servicios web RESTful.
* **[React](https://react.dev/):** Librería de JavaScript basada en componentes declarativos y reutilizables empleada para construir la interfaz SPA del cliente.
* **[Node.js](https://nodejs.org/):** Entorno de ejecución para JavaScript en el servidor, utilizado en el proyecto como motor del gestor de paquetes (`npm`) y para el empaquetado del frontend.
* **[MySQL](https://www.mysql.com/):** Sistema de gestión de bases de datos relacional utilizado para el almacenamiento persistente de usuarios, pistas, palas y reservas.
* **[Vite](https://vitejs.dev/):** Herramienta de compilación rápida (*bundler*) y servidor de desarrollo optimizado para aplicaciones frontend en React.

## Herramientas

Herramientas auxiliares y entornos de desarrollo (IDE) empleados durante la construcción de la aplicación:

* **[IntelliJ IDEA](https://www.jetbrains.com/idea/):** Entorno de desarrollo integrado (IDE) avanzado utilizado para la programación y ejecución del servidor backend en Java/Spring Boot.
* **[Docker Desktop](https://www.docker.com/products/docker-desktop/):** Plataforma de virtualización a nivel de sistema operativo utilizada para aislar y desplegar servicios en contenedores (base de datos MySQL local y entornos de prueba).
* **[Postman](https://www.postman.com/):** Herramienta cliente HTTP para interactuar de forma aislada con la API REST y testear endpoints antes de la integración.
* **[GitHub](https://github.com/codeurjc-students/2026-YoSoyTuPadel):** Sistema de control de versiones distribuido empleado para el seguimiento del código fuente y el trabajo en ramas.

## Arquitectura

### API REST
La especificación técnica y documentación interactiva de la API REST se genera de forma automatizada mediante la integración de `springdoc-openapi-starter-webmvc-ui` y `springdoc-openapi-maven-plugin`, los cuales compilan la documentación de la API Rest en un documento OpenAPI v3 (`api-docs.yaml`) y posteriormente compilan la vista HTML con Redocly.

* **[Ver Documentación Interactiva de la API REST en HTML (vía RawGithack)](https://raw.githack.com/codeurjc-students/2026-YoSoyTuPadel/main/docs/api/api-docs.html)**

## Ejecución y Edición de Código

Esta sección detalla las instrucciones para clonar, configurar, ejecutar localmente y probar la aplicación **YoSoyTuPadel** partiendo desde el código fuente del repositorio.

### Clonado del Repositorio
Para obtener una copia local del proyecto, abre una terminal y ejecuta el siguiente comando:
```bash
git clone https://github.com/codeurjc-students/2026-YoSoyTuPadel
```

### Instrucciones de Ejecución

#### Requisitos Previos del Sistema
- **Java JDK 21** o superior.
- **Node.js** (v18+) y **npm**.
- **Docker** y **Docker Compose** (para la gestión de servicios auxiliares).
- Navegador **Google Chrome** (para pruebas de sistema con Selenium).

#### Ejecución de la Base de Datos y Servicios Auxiliares
El servidor backend requiere una base de datos **MySQL** para la persistencia de datos en entorno local.
Inicia el contenedor de la base de datos mediante Docker Compose desde la raíz del proyecto:
```bash
docker-compose up -d
```

#### Comandos para Ejecutar las Partes de la Aplicación

#### 1. Ejecución del Servidor Backend (Spring Boot)
Abre una terminal en la carpeta backend del proyecto y ejecuta:
```bash
mvn spring-boot:run
```

#### 2. Ejecución del Cliente Frontend (React + Vite)
En una segunda terminal, accede al directorio del frontend, instala las dependencias e inicia el servidor de desarrollo:
```bash
npm install
npm run dev
```

#### Acceso a la Página Web Ejecutada en Local

Una vez levantados ambos servicios (Backend en puerto 8080 y Frontend en el servidor de desarrollo de Vite), abre cualquier navegador e ingresa a la URL: http://localhost:5173