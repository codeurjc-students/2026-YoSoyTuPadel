# 2026-YoSoyTuPadel: una aplicación web diseñada para digitalizar y gestionar la actividad diaria de una academia de pádel
YoSoyTuPadel es una página web que automatiza la reserva de pistas y el alquiler del equipamiento propio del club (palas), así como la contratación de entrenadores privados, conectando de forma efectiva a los alumnos, entrenadores y al administrador del centro. De esta forma, se aseguran horarios y disponibilidad en tiempo real, permitiendo a la comunidad del club gestionar sus actividades deportivas de manera cómoda sin tener que ir a la academia.

Este proyecto es mi Trabajo de Fin de Grado (TFG). Se desarrolla siguiendo estrictamente las directrices metodológicas de la Universidad Rey Juan Carlos. El proceso está estructurado en diferentes fases de desarrollo, reflejadas en la organización de este archivo README. Para la elaboración de esta planificación, se ha seguido como referencia el documento: [Desarrollo de una aplicación web como TFG](https://urjc-my.sharepoint.com/:w:/r/personal/micael_gallego_urjc_es/_layouts/15/Doc.aspx?sourcedoc=%7BC6E36275-66B0-42E1-B228-36C4AC67F162%7D&file=Desarrollo%20de%20una%20aplicaci%C3%B3n%20web%20como%20TFG%20v4.docx&action=default&mobileredirect=true).

## 📋Información del proyecto

* **Nombre de la App:** YoSoyTuPadel
* **Estudiante:** Víctor Candel Casado
* **Tutor:** Michel Maes Bermejo
* **Archivo de seguimiento:** [Seguimiento TFG](https://urjc-my.sharepoint.com/:w:/r/personal/micael_gallego_urjc_es/Documents/Formacion_CodeURJC/TFGs/TFGs%20por%20tutor/TFGs%20Michel/2026-27/Victor%20Candel/Seguimiento%20TFG.docx?d=w2ccb69f8b81a4d0ea43f91e6c2e8a255&csf=1&web=1&e=ahCtmf)


# FASE 1 : Definición de funcionalidades y pantallas
## Entidades

| Entidad | Descripción | Acciones |
| :--- | :--- | :--- | 
| **User (Usuario)** | Almacena toda la información sobre un usuario específico en la plataforma. Puede ser de los siguientes tipos: Usuario no registrado, Alumno, Entrenador o Administrador | - Iniciar sesión<br>- Cerrar sesión<br>- Editar perfil<br>- Eliminar usuario | 
| **Racket (Pala)** | Representa las palas de la academia disponibles para alquiler, opcionalmente, el usuario puede llevar su propia pala tambièn. (tanto para reserva de pista como para entrenamientos)| - Alquilar pala<br>Para el admin :<br> - Editar detalles<br>- Cambiar disponibilidad<br>  | 
| **Court (Pista)** | Representa las instalaciones físicas de las pistas de pádel en el club. | Para el admin :<br> - Crear pista<br>- Eliminar pista<br>- Editar pista | 
| **Booking (Reserva)** | Vincula a un Usuario, una Pista y, opcionalmente, una pala para una fecha y un intervalo de tiempo concretos. | - Crear reserva<br>- Cancelar reserva<br>  |

### Diagrama inicial de clases 

<img width="920" height="823" alt="DiagramaDeClasesInicial" src="https://github.com/user-attachments/assets/9876e0b1-0f3a-4f5e-ac71-6ba7f8802f8b" />


## 🔍Objetivos

### Objetivos funcionales

El propósito funcional de YoSoyTuPadel es proporcionar una plataforma digital que resuelva la gestión de un club o academia de padel. La aplicación busca erradicar los solapamientos de horarios, flexibilizar la reserva de material e instalaciones sin requerir la presencia de personal, y dotar a los alumnos y profesores de un canal interactivo para coordinar entrenamientos, garantizando la transparencia informativa al establecer que todas las transacciones económicas se liquidan en la sede del club.

* **Autenticación y Roles de Acceso:** Ofrecer un sistema de registro seguro que distinga las interfaces y capacidades operativas de Usuarios no registrado, Alumnos, Entrenadores y el Administrador.
* **Reserva de Espacios Deportivos (Pistas):** Permitir a los usuarios agendar turnos de juego en franjas horarias concretas asociadas a pistas físicas.
* **Alquiler de Material Técnico:** Dar la posibilidad a los clientes de alquilar palas del inventario del club sin pasarelas de pago virtuales intermedias.
* **Gestión del Progreso Deportivo:** Proveer a los entrenadores de herramientas integradas para evaluar y reajustar los niveles de juego de los alumnos a los que ha entrenado.
* **Administración del Centro:** Dotar al administrador de la capacidad exclusiva para la creación, modificación y eliminación (CRUD) de las pistas y palas.

### Objetivos técnicos

El desarrollo técnico se abordará bajo una arquitectura moderna desacoplada que garantice el rendimiento, la escalabilidad y la facilidad de mantenimiento del software. Se planifica la construcción de un backend basado en microservicios o API REST monolítica que interactúe con una base de datos relacional, mientras que el frontend se estructurará como una aplicación de página única (SPA) interactiva.

* **Arquitectura desacoplada API REST:** Implementación del backend utilizando Java con el framework Spring Boot para dotar a la web de servicios seguros y estandarizados.
* **Interfaz de Usuario SPA:** Creación del frontend mediante React para construir una aplicación de página única fluida, reactiva y con componentes modulares.
* **Persistencia Relacional Robusta:** Diseño de un esquema de base de datos óptimo y seguro utilizando MySQL para velar por la integridad referencial del negocio.
* **Contenedorización del Entorno:** Configuración de contenedores independientes con Docker y Docker Compose para aislar el backend, frontend y la base de datos, simplificando el entorno de desarrollo.

> En esta etapa del proyecto sólo se han definido los objetivos funcionales y los objetivos técnicos de la aplicación, pero no se ha comenzado su implementación todavía.


## ⚙️Funcionalidades 
### Funcionalidades Básicas
Todas las entidades tendrán operaciones CRUD. Aunque obviamente alguna de estas operaciones serán propias del administrador, como crear una entidad pala o una entidad pista.

### Funcionalidades Intermedias
* **Gestión de Nivel:** Permite a los usuarios con rol de **Entrenador** evaluar a los jugadores que han asistido a sus entrenamientos. El entrenador dispondrá de la capcidad de modificar el nivel del alumno para ajustarla a su desempeño real, incluyendo la capacidad de bajarle el nivel técnico en la plataforma si se considera necesario.
* **Nivelación inicial:** Permite a los usuarios iniciantes en la aplicación adquirir un nivel inicial al registrarse, asignandoles un nivel determinado dependiendo de las respuestas del mismo a una serie de preguntas.

### Funcionalidades Avanzadas
* **Sistema de Filtrado de Pistas:** Implementación de un filtrp de búsqueda dinámico en la selección de pistas a reservar. Los usuarios podrán filtrar las pistas disponibles en tiempo real según distintos  criterios como el precio o el tipo de pista (al aire libre o techado).


## 🔐Permisos de usuario

La siguiente tabla detalla los permisos de los usuarios para las acciones principales de la web. Cabe destacar que todas las transacciones financieras se gestionan físicamente en la sede de la academia. También que algunas acciones no esten disponibles porque no se les encuentra sentido como por ejemplo puede ser que un administrador alquile una pala.

| Acción | Anónimo | Registrado (Alumno) | Entrenador | Administrador |
| :--- | :--- | :--- | :--- | :--- |
| **Ver página de inicio / Info** | sí | sí | sí | sí |
| **Ver página de palas, entrenadores o pistas** | sí | sí | sí | sí |
| **Reservar pista / Alquilar pala / Contratar entrenador** | no | sí | no | no |
| **Modificar/Bajar nivel de un jugador** | no | no | sí | sí |
| **Gestionar catálogo de palas y pistas (CRUD)**| no | no | no | sí |
| **Ver / Modificar / Eliminar - Perfil** | no | sí | sí | no |


## 🖼️Imágenes

La aplicación será capaz de gestionar imágenes subidas por los usuarios para personalizar la interfaz de perfil de usuario:
* Los usuarios alumnos pueden subir una foto de perfil, tanto subir una nueva si no se tiene, como modificar una ya presubida.
* De igual forma, los entrenadores podrán hacer lo mismo que los usurios, pero están podrán ser vista por los alumnos a la hora de buscar en el catálogo de entrenadores.
* Cada entidad pala incluirá una fotografía en el catálogo, la cual se encargará de subir el administrador para que los alumnos conozcan el modelo real que van a alquilar.


## 📈Gráficos

* **Gráficos de líneas:** Cada usuario alumno tendrá en su perfil un gráfico de la progresión de su nivel a lo largo de los entrenamientos.

## 🛠️Tecnologías complementarias

* **Integración de Mapas (Google Maps / OpenStreetMap API):** Se utilizará una API de mapas interactivos en la interfaz del usuario para posicionar geográficamente las pistas de la academia, permitiendo mostrar de manera precisa la ubicación de las pistas e instalaciones del club mediante marcadores personalizados.

## 🤖Algoritmo o consulta avanzada

El usuario podrá filtrar a su gusto las pistas que le aparecen en el catálogo de pistas, ya bien sea por precio, tipo, tipo de paredes, o valoraciones(las pistas estarán valoradas por una calificación).

## 💻 Boceto de pantallas
