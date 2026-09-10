# 🎾 2026-YoSoyTuPadel

**YoSoyTuPadel** es una aplicación web diseñada para digitalizar y gestionar la actividad diaria de una academia de pádel. 

La plataforma automatiza la reserva de pistas y el alquiler del equipamiento propio del club (palas), así como la contratación de entrenadores privados, conectando de forma efectiva a los alumnos, entrenadores y al administrador del centro. De esta forma, se aseguran horarios y disponibilidad en tiempo real, permitiendo a la comunidad del club gestionar sus actividades deportivas de manera cómoda sin tener que acudir a la academia presencialmente.

> Este proyecto es mi Trabajo de Fin de Grado (TFG) del Doble Grado en Ingeniería Informática e Ingeniería del Software. Se desarrolla siguiendo estrictamente las directrices metodológicas de la Universidad Rey Juan Carlos.

## 🗂️ Índice de Documentación

Toda la documentación técnica y el proceso de desarrollo del proyecto se encuentra dividida en la carpeta `/docs`:

1. [Información del Proyecto y Autores](./docs/informacion-proyecto.md)
2. [Objetivos del Sistema](./docs/objetivos.md)
3. [Análisis y Entidades](./docs/analisis.md)
4. [Funcionalidades y Roles de Usuario](./docs/funcionalidades.md)
5. [Guía de Desarrollo y Arquitectura](./docs/guia-desarrollo.md)
6. [Proceso de Desarrollo y Calidad (CI/CD)](./docs/proceso-desarrollo.md)

## ✨ Características Principales

* **Reserva de pistas:** Agendamiento de turnos de juego en tiempo real evitando solapamientos.
* **Alquiler de material:** Catálogo digital para alquilar palas directamente desde el club.
* **Sistema de entrenamientos:** Contratación de profesores y evaluación de nivel tras las sesiones.
* **Filtrado dinámico:** Búsqueda multicriterio de pistas e instalaciones por precio, tipo y valoraciones.
* **Perfiles interactivos:** Seguimiento gráfico del progreso y nivel de cada jugador.

## 🛠️ Stack Tecnológico

El desarrollo técnico se aborda bajo una arquitectura moderna SPA desacoplada:

* **Frontend:** React, TypeScript, Vite, Node.js
* **Backend:** Java 21, Spring Boot 4.0.7 (API REST monolítica)
* **Base de Datos:** MySQL
* **Infraestructura:** Docker y Docker Compose
* **Calidad y CI/CD:** GitHub Actions, JUnit 5, Vitest, Testcontainers, SonarCloud

## 🚀 Ejecución Rápida

Para instrucciones detalladas sobre cómo levantar el entorno local de desarrollo con Docker, Spring Boot y Vite, por favor consulta la [Guía de Desarrollo](./docs/guia-desarrollo.md#ejecución-y-edición-de-código).
