# 🔍 Objetivos

## Objetivos funcionales

El propósito funcional de YoSoyTuPadel es proporcionar una plataforma digital que resuelva la gestión de un club o academia de pádel. La aplicación busca erradicar los solapamientos de horarios, flexibilizar la reserva de material e instalaciones sin requerir la presencia de personal, y dotar a los alumnos y profesores de un canal interactivo para coordinar entrenamientos, garantizando la transparencia informativa al establecer que todas las transacciones económicas se liquidan en la sede del club.

* **Autenticación y Roles de Acceso:** Ofrecer un sistema de registro seguro que distinga las interfaces y capacidades operativas de Usuarios no registrados, Alumnos, Entrenadores y el Administrador.
* **Reserva de Espacios Deportivos (Pistas):** Permitir a los usuarios agendar turnos de juego en franjas horarias concretas asociadas a pistas físicas.
* **Alquiler de Material:** Dar la posibilidad a los clientes de alquilar palas del inventario del club sin pasarelas de pago virtuales intermedias.
* **Gestión del Progreso Deportivo:** Proveer a los entrenadores de herramientas integradas para evaluar y reajustar los niveles de juego de los alumnos a los que ha entrenado.
* **Administración del Centro:** Dotar al administrador de la capacidad exclusiva para la creación, modificación y eliminación (CRUD) de las pistas y palas.

## Objetivos técnicos

El desarrollo técnico se abordará bajo una arquitectura moderna desacoplada que garantice el rendimiento, la escalabilidad y la facilidad de mantenimiento del software. Se planifica la construcción de un backend basado en microservicios o API REST monolítica en Java que interactúe con una base de datos relacional, mientras que el frontend se estructurará como una aplicación de página única (SPA) interactiva.

* **Arquitectura desacoplada API REST:** Implementación del backend utilizando Java con el framework Spring Boot para dotar a la web de servicios seguros y estandarizados.
* **Interfaz de Usuario SPA:** Creación del frontend mediante React para construir una aplicación de página única fluida, reactiva y con componentes modulares.
* **Persistencia Relacional Robusta:** Diseño de un esquema de base de datos óptimo y seguro utilizando MySQL para asegurar la integridad referencial del negocio.
* **Contenedorización del Entorno:** Configuración de contenedores independientes con Docker y Docker Compose para aislar el backend, frontend y la base de datos, simplificando el entorno de desarrollo.

> En esta etapa del proyecto solo se han definido los objetivos funcionales y los objetivos técnicos de la aplicación, pero no se ha comenzado su implementación todavía.