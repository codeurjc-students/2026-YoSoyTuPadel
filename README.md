# 🎾 2026-YoSoyTuPadel:  Una aplicación web diseñada para digitalizar y gestionar la actividad diaria de una academia de pádel. 

En su **versión 0.1**, la aplicación ofrece al usuario estudiante un catálogo funcional donde se pueden visualizar las pistas disponibles, consultar la plantilla de entrenadores de la academia y explorar el inventario de palas, pudiendo hacer reservas de todos ellos y pudiendo acceder tanto a su perfil como a una vista resumen de todas sus reservas, tanto pendientes como terminadas. Por otro lado los entrenadores podrán ver las reservas que tienen con el usuario correspondiente pudiendo cancelarlas. El administrador podrá acceder a los catálogos pudiendo editar, añadir y eliminar todas las entidades, cuenta también con su propdio padel de administración en el que puede ver y modificar cualquier usuario y reserva. Asentando así la base de la infraestructura técnica, la interfaz de usuario (SPA) y los pipelines automatizados de entrega continua.

> 🚧 **Estado del proyecto:** La aplicación se encuentra en desarrollo activo continuo. Se siguen implementando mejoras y nuevas funcionalidades iterativamente.

## 🎥 Vídeo de la Versión 0.1
En el siguiente enlace se puede encontrar el vídeo que muestran las funcionalidades principales actuales, diferenciadas por los roles de usuario:

[VÍDEO YoSoyTuPadel Versión 0.1](https://urjc-my.sharepoint.com/:v:/r/personal/v_candel_2020_alumnos_urjc_es/_layouts/15/stream.aspx?id=%2Fpersonal%2Fv%5Fcandel%5F2020%5Falumnos%5Furjc%5Fes%2FDocuments%2FEscritorio%2FURJC%2FTFG%2Fvideos%2FVideo%2Dv%2D0%2D1%2Emp4&share=cQoNsGeTuRSfQKf91wIG6jj1EgUCi2M3ho0hEdTc%5FuGKY1cEjw)


## 📸 Capturas de Pantallas Principales (v0.1)
* Vista principal o Menú:
  
  <img width="1117" height="833" alt="image" src="https://github.com/user-attachments/assets/c96beedb-304e-4ad4-b6ab-488bd89b3ef6" />


* Catálogo de Palas:
  
  <img width="1066" height="906" alt="image" src="https://github.com/user-attachments/assets/6db1487e-630c-4883-916a-6dd6bbd9f94b" />


* Catálogo de Entrenadores

  <img width="1063" height="908" alt="image" src="https://github.com/user-attachments/assets/3c57e6bf-397c-4b13-8d93-ea9282d64a8e" />

  
* Catálogo de Pistas

  <img width="1066" height="907" alt="image" src="https://github.com/user-attachments/assets/2cea9cb3-40e5-4f60-ac17-1fdbcfde7687" />


* Perfil de usuario

  <img width="1363" height="862" alt="image" src="https://github.com/user-attachments/assets/2e557afb-751e-4c7f-a6d4-254b9e166358" />


* Panel "Mis Reservas" de un usuario

  <img width="1243" height="897" alt="image" src="https://github.com/user-attachments/assets/32bc3ff2-e7b4-44cc-a9cc-6beab20a2b57" />


* Panel de administración de un administrador (Usuarios)

  <img width="1012" height="866" alt="image" src="https://github.com/user-attachments/assets/7e8dd806-e7a3-4f98-8f9f-b8bb92f29d51" />


* Panel de administración de un administrador (Reservas)

  <img width="1041" height="907" alt="image" src="https://github.com/user-attachments/assets/eb6a0ad5-4f8f-4f3c-b923-618b849c6274" />


## 🔮 Próximas Funcionalidades
Para las siguientes versiones se espera la implementación de las siguientes funcionalidades intermedias y avanzadas del sistema:

* **Gestión de Nivel (Funcionalidad Intermedia):** Permite a los usuarios con rol de Entrenador evaluar a los jugadores que han asistido a sus entrenamientos. El entrenador dispondrá de la capacidad de modificar el nivel del alumno para ajustarlo a su desempeño real, incluyendo la posibilidad de bajarle el nivel técnico en la plataforma si se considera necesario.
* **Nivelación inicial (Funcionalidad Intermedia):** Permite a los usuarios iniciantes o no registrados en la aplicación adquirir un nivel inicial al registrarse, asignándoles un nivel determinado dependiendo de las respuestas del mismo a una serie de preguntas.
* **Sistema de Filtrado de Pistas (Funcionalidad Avanzada):** Implementación de un filtro de búsqueda dinámico en la selección de pistas a reservar. Los usuarios podrán filtrar las pistas disponibles en tiempo real según distintos criterios como el precio o el tipo de pista (al aire libre o techado).

## 🛠️ Stack Tecnológico
El desarrollo técnico se aborda bajo una arquitectura moderna SPA desacoplada:
* **Frontend:** React, TypeScript, Vite, Node.js
* **Backend:** Java 21, Spring Boot 4.0.7 (API REST monolítica)
* **Base de Datos:** MySQL
* **Infraestructura:** Docker y Docker Compose
* **Calidad y CI/CD:** GitHub Actions, JUnit 5, Vitest, Testcontainers, SonarCloud

---

## 🗂️ Índice de Documentación

Toda la documentación técnica y el proceso de desarrollo del proyecto se encuentra dividida en la carpeta `/docs`:

1. [Información del Proyecto y Autores](./docs/informacion-proyecto.md)
2. [Objetivos del Sistema](./docs/objetivos.md)
3. [Análisis y Entidades](./docs/analisis.md)
4. [Funcionalidades y Roles de Usuario](./docs/funcionalidades.md)
5. [Guía de Desarrollo y Arquitectura](./docs/guia-desarrollo.md)
6. [Proceso de Desarrollo y Calidad (CI/CD)](./docs/proceso-desarrollo.md)
7. [Ejecución y Despliegue de la Aplicación](./docs/ejecucion.md)

