# 2026-YoSoyTuPadel: una aplicación web diseñada para digitalizar y gestionar la actividad diaria de una academia de pádel
YoSoyTuPadel es una página web que automatiza la reserva de pistas y el alquiler del equipamiento propio del club (palas), así como la contratación de entrenadores privados, conectando de forma efectiva a los alumnos, entrenadores y al administrador del centro. De esta forma, se aseguran horarios y disponibilidad en tiempo real, permitiendo a la comunidad del club gestionar sus actividades deportivas de manera cómoda sin tener que acudir a la academia presencialmente.

Este proyecto es mi Trabajo de Fin de Grado (TFG). Se desarrolla siguiendo estrictamente las directrices metodológicas de la Universidad Rey Juan Carlos. El proceso está estructurado en diferentes fases de desarrollo, reflejadas en la organización de este archivo README. Para la elaboración de esta planificación, se ha seguido como referencia el documento: [Desarrollo de una aplicación web como TFG](https://urjc-my.sharepoint.com/:w:/r/personal/micael_gallego_urjc_es/_layouts/15/Doc.aspx?sourcedoc=%7BC6E36275-66B0-42E1-B228-36C4AC67F162%7D&file=Desarrollo%20de%20una%20aplicaci%C3%B3n%20web%20como%20TFG%20v4.docx&action=default&mobileredirect=true).

## 📋Información del proyecto

* **Nombre de la App:** YoSoyTuPadel
* **Estudiante:** Víctor Candel Casado
* **Grado:** GII + GIS
* **Tutor:** Michel Maes Bermejo
* **Archivo de seguimiento:** [Seguimiento TFG](https://urjc-my.sharepoint.com/:w:/r/personal/micael_gallego_urjc_es/Documents/Formacion_CodeURJC/TFGs/TFGs%20por%20tutor/TFGs%20Michel/2026-27/Victor%20Candel/Seguimiento%20TFG.docx?d=w2ccb69f8b81a4d0ea43f91e6c2e8a255&csf=1&web=1&e=ahCtmf)

## 📌 Proceso metodológico del proyecto

- [Fase 1: Definición de funcionalidades y pantallas](#fase-1-definición-de-funcionalidades-y-pantallas)
- [Fase 2: Configuración del repositorio, pruebas unitarias y CI](#fase-2-configuración-del-repositorio-pruebas-unitarias-y-ci)


## Entidades de la aplicación

| Entidad | Descripción | Acciones |
| :--- | :--- | :--- | 
| **User (Usuario)** | Almacena toda la información sobre un usuario específico en la plataforma, podrá hacer y cancelar reservas y alquilar palas. Puede ser de los siguientes tipos: Usuario no registrado, Alumno, Entrenador o Administrador | - Registrarse (Usuario no registrado)<br> - Iniciar sesión<br>- Cerrar sesión<br>- Editar perfil<br>- Eliminar usuario | 
| **Racket (Pala)** | Representa las palas de la academia disponibles para alquiler, opcionalmente, el usuario puede llevar su propia pala también. (tanto para reserva de pista como para entrenamientos)| - Alquilar pala<br>- Ver detalles <br> Para el admin :<br> - Editar detalles<br>- Eliminar pala<br>  | 
| **Court (Pista)** | Representa las instalaciones físicas de las pistas de pádel en el club. | - Ver detalles <br> Para el admin :<br> - Crear pista<br>- Eliminar pista<br>- Editar pista | 
| **Booking (Reserva)** | Vincula a un usuario alumno y una pista en una fecha y un intervalo de tiempo concretos. | - Crear reserva<br>- Cancelar reserva<br>  |

### Diagrama inicial de clases 

<img width="920" height="573" alt="DiagramaDeClasesInicial" src="https://github.com/user-attachments/assets/bd4d9a4f-d187-4469-ba4e-02d63e52b1a4" />


# Fase 1: Definición de funcionalidades y pantallas


## Funcionalidad para Tipos de Usuario
- Usuario No Registrado: Podrá entrar en la página principal de la aplicación y podrá ver tanto el catálogo de palas, la lista de entrenadores y la lista de pistas disponibles pero no podrá hacer uso de los servicios de la academia. Es decir, no podrá alquilar palas, no podrá contratar entrenadores ni reservar pistas, y obviamente no podrá entrar en la pantalla de perfil de usuario.
- Usuario Registrado (Alumno): Podrá hacer lo mismo que el usuario registrado pero teniendo acceso a los servicios de la plataforma tales como alquilar una pala, contratar a un entrenador, reservar una pista o entrar en su perfil, pudiendo modificarlo o incluso eliminar su cuenta.
- Entrenador: El entrenador tendrá la capacidad para modificar el nivel de un alumno después de un entrenamiento con el mismo. De igual forma que el usuario, podrá entrar en su perfil con las mismas capacidades.
- Administrador: El administrador podrá acceder a todas las pantallas de la aplicación y modificar el catálogo de palas y pistas. También tendrá la capacidad para modificar el nivel de un alumno o incluso eliminar su usuario.



## 🔐Permisos de usuario

La siguiente tabla detalla los permisos de los usuarios para las acciones principales de la web. Cabe destacar que todas las transacciones financieras se gestionan físicamente en la sede de la academia. También cabe destacar que algunas acciones no estén disponibles porque no tienen sentido en el contexto del negocio, como por ejemplo que un administrador alquile una pala.

| Acción | Anónimo | Registrado (Alumno) | Entrenador | Administrador |
| :--- | :--- | :--- | :--- | :--- |
| **Ver página de inicio / Info** | sí | sí | sí | sí |
| **Ver página de palas, entrenadores o pistas** | sí | sí | sí | sí |
| **Reservar pista / Alquilar pala / Contratar entrenador** | no | sí | no | no |
| **Modificar nivel de un alumno** | no | no | sí | sí |
| **Gestionar catálogo de palas y pistas (CRUD)**| no | no | no | sí |
| **Ver / Modificar / Eliminar - Perfil** | no | sí | sí | no |


## 🔍Objetivos

### Objetivos funcionales

El propósito funcional de YoSoyTuPadel es proporcionar una plataforma digital que resuelva la gestión de un club o academia de pádel. La aplicación busca erradicar los solapamientos de horarios, flexibilizar la reserva de material e instalaciones sin requerir la presencia de personal, y dotar a los alumnos y profesores de un canal interactivo para coordinar entrenamientos, garantizando la transparencia informativa al establecer que todas las transacciones económicas se liquidan en la sede del club.

* **Autenticación y Roles de Acceso:** Ofrecer un sistema de registro seguro que distinga las interfaces y capacidades operativas de Usuarios no registrados, Alumnos, Entrenadores y el Administrador.
* **Reserva de Espacios Deportivos (Pistas):** Permitir a los usuarios agendar turnos de juego en franjas horarias concretas asociadas a pistas físicas.
* **Alquiler de Material:** Dar la posibilidad a los clientes de alquilar palas del inventario del club sin pasarelas de pago virtuales intermedias.
* **Gestión del Progreso Deportivo:** Proveer a los entrenadores de herramientas integradas para evaluar y reajustar los niveles de juego de los alumnos a los que ha entrenado.
* **Administración del Centro:** Dotar al administrador de la capacidad exclusiva para la creación, modificación y eliminación (CRUD) de las pistas y palas.

### Objetivos técnicos

El desarrollo técnico se abordará bajo una arquitectura moderna desacoplada que garantice el rendimiento, la escalabilidad y la facilidad de mantenimiento del software. Se planifica la construcción de un backend basado en microservicios o API REST monolítica en Java que interactúe con una base de datos relacional, mientras que el frontend se estructurará como una aplicación de página única (SPA) interactiva.

* **Arquitectura desacoplada API REST:** Implementación del backend utilizando Java con el framework Spring Boot para dotar a la web de servicios seguros y estandarizados.
* **Interfaz de Usuario SPA:** Creación del frontend mediante React para construir una aplicación de página única fluida, reactiva y con componentes modulares.
* **Persistencia Relacional Robusta:** Diseño de un esquema de base de datos óptimo y seguro utilizando MySQL para asegurar la integridad referencial del negocio.
* **Contenedorización del Entorno:** Configuración de contenedores independientes con Docker y Docker Compose para aislar el backend, frontend y la base de datos, simplificando el entorno de desarrollo.

> En esta etapa del proyecto solo se han definido los objetivos funcionales y los objetivos técnicos de la aplicación, pero no se ha comenzado su implementación todavía.


## ⚙️Funcionalidades 
### Funcionalidades Básicas
Todas las entidades tendrán operaciones CRUD. Aunque obviamente alguna de estas operaciones serán propias del administrador, como la creación de una entidad pala (Racket) o una entidad pista (Court).

### Funcionalidades Intermedias
* **Gestión de Nivel:** Permite a los usuarios con rol de **Entrenador** evaluar a los jugadores que han asistido a sus entrenamientos. El entrenador dispondrá de la capacidad de modificar el nivel del alumno para ajustarlo a su desempeño real, incluyendo la posibilidad de bajarle el nivel técnico en la plataforma si se considera necesario.
* **Nivelación inicial:** Permite a los usuarios iniciantes o no registrados en la aplicación adquirir un nivel inicial al registrarse, asignándoles un nivel determinado dependiendo de las respuestas del mismo a una serie de preguntas.

### Funcionalidades Avanzadas
* **Sistema de Filtrado de Pistas:** Implementación de un filtro de búsqueda dinámico en la selección de pistas a reservar. Los usuarios podrán filtrar las pistas disponibles en tiempo real según distintos criterios como el precio o el tipo de pista (al aire libre o techado).



## 🖼️Imágenes

La aplicación será capaz de gestionar imágenes subidas por los usuarios para personalizar la interfaz de perfil de usuario:
* Los usuarios alumnos pueden subir una foto de perfil, tanto subir una nueva si no se tiene, como modificar una ya presubida.
* De igual forma, los entrenadores podrán hacer lo mismo que los usuarios alumno, pero estas podrán ser vista por los alumnos a la hora de buscar en el catálogo de entrenadores.

Cada entidad pala incluirá una fotografía en el catálogo, la cual se encargará de subir el administrador para que los alumnos conozcan el modelo real que van a alquilar.


## 📈Gráficos

* **Gráficos de líneas:** Cada usuario alumno tendrá en su perfil un gráfico de la progresión de su nivel a lo largo de los entrenamientos, subiendo o bajando de puntuación dependiendo de su desempeño en los entrenos y la valoración que le asigne el entrenador correspondiente.


## 🛠️Tecnologías complementarias

* **Integración de Mapas (Google Maps / OpenStreetMap API):** Se utilizará una API de mapas interactivos en la pantalla de los detalles de una pista para posicionarla geográficamente, lo que permitirá mostrar de manera precisa la ubicación de las pistas e instalaciones del club mediante marcadores personalizados.


## 🤖Algoritmo o consulta avanzada

El usuario podrá filtrar a su gusto las pistas que le aparecen en el catálogo de pistas, ya sea por precio, tipo, tipo de paredes o valoraciones (las pistas estarán valoradas por una calificación) mediante un filtrado dinámico multicriterio en tiempo real.


## 💻 Boceto de pantallas

### Pantalla de inicio de sesión o registro 
En estas pantallas, los usuarios podrán iniciar sesión para hacer uso de los servicios que ofrece la aplicación de la academia o por el contrario registrarse si son usuarios no registrados: 
- Para el inicio de sesión: 

<img width="1912" height="855" alt="image" src="https://github.com/user-attachments/assets/fbeb4318-e6bd-4a72-95bb-54fadc8923dc" />

- Para el registro: 

<img width="1915" height="860" alt="image" src="https://github.com/user-attachments/assets/0d6f8fb5-9dd9-4ac1-ac0a-57d35a76b4e9" />

Tras introducir los datos de registro el nuevo alumno responderá una serie de preguntas para determinar su nivel inicial. En dicho cuestionario también habrá la posibilidad de cancelar el registro, pasar a la siguiente pregunta o finalizar registro.
A continuación se muestras dos bocestos de ejemplo: 

<img width="596" height="817" alt="image" src="https://github.com/user-attachments/assets/9c081a32-bd78-46a5-b5c5-2edfc1cb5b3c" />


<img width="598" height="775" alt="image" src="https://github.com/user-attachments/assets/2057478d-1b65-4d19-9520-19e97d21e2af" />


### Pantalla del Menú Principal
Desde esta pantalla se podrá acceder al catálogo de palas de alquiler, la lista de entrenadores para contratar y la reserva de pistas. De igual forma, si el usuario es un alumno o un profesor, se podrá acceder a la pantalla del perfil de usuario. Adicionalmente se incluirá el nombre del usuario, la fecha actual y la fecha y hora del próximo entreno que haya contratado:

<img width="1162" height="617" alt="image" src="https://github.com/user-attachments/assets/1ca33a11-987a-49e7-8cff-fd44069ed3ec" />


### Pantalla de Perfil del Usuario
En esta interfaz el usuario registrado podrá observar todos sus atributos como el nombre, el nickname, el peso, etc. También se encontrará aquí el número de partidos jugados, el número de entrenamientos realizados y la gráfica de líneas de la progresión del nivel del jugador. El usuario podrá también editar o eliminar su perfil desde esta pantalla. Donde se aprecia VC iría la foto de usuario: 

<img width="537" height="803" alt="image" src="https://github.com/user-attachments/assets/9f5e5f68-b757-4411-a43b-3c8d89bf42ae" />


 
### Pantalla de Catálogo de Palas
En esta vista se mostrarán todas las palas disponibles con su correspondiente foto, nombre, marca, precio por uso y valoración. Además de poder volver al menú principal el usuario podrá ver detalles más precisos del producto antes de alquilarlo. En esta ventana el administrador podrá crear nuevas palas, o modificar o eliminar las existentes:

<img width="1052" height="798" alt="image" src="https://github.com/user-attachments/assets/24e64c54-ee12-4c26-9bfb-5b62606402b5" />


### Formulario de alta de una pala
En este formulario accesible desde el catálogo de palas el administrador podrá completar los datos de una pala que desee dar de alta, también podrá cancelarlo o volver al catálogo de palas.

<img width="690" height="833" alt="image" src="https://github.com/user-attachments/assets/a1dea2ea-5d24-48c2-aee1-bc15e79387d5" />


### Pantalla de Lista de entrenadores 
En esta pantalla se mostrará la lista de entrenadores disponibles con su respectiva imagen, nombre, especialidad de enseñanza, nivel de certificación de la FEP (Federación Española de Pádel), valoración y precios por sesión. Además se podrá volver al menú principal:

<img width="932" height="868" alt="image" src="https://github.com/user-attachments/assets/918499cf-67a3-47c2-adbb-368dfa933f98" />


### Pantalla de Lista de Pistas Para Reservar
En esta vista se mostrarán todas las pistas disponibles con una vista previa de su ubicación (aunque en este caso se pone una foto genérica hasta su implementación), nombre , tipo, precio por hora y si hay destacadas. De forma similar a la pantalla del catálogo de palas, el usuario podrá ver sus detalles antes de reservarla. También se podrá volver al menú principal. En esta ventana el administrador podrá crear nuevas pistas, o modificar o eliminar las existentes:

<img width="1073" height="863" alt="image" src="https://github.com/user-attachments/assets/f82ce3b9-d181-405a-8d62-cc3bff0142f8" />

### Pantalla de disponibilidad, detalles y reserva de una pista
Si un usuario quiere reservar una pista pista, tras clickar en el botón de disponibilidad de la pista correspondiente de la lista de pistas disponible podrá ver detalles más especificos de la pista. También podrá seleccionar una hora determinada de un día elegido a su elección y finalizar la reserva. De igual forma podrá cancelar y volver al catálogo de pistas. 

<img width="547" height="840" alt="image" src="https://github.com/user-attachments/assets/6e85936c-818c-4a3f-9a27-13808cd01ad3" />

Tras finalizar la reserva de la pista el usuario podrá ver un mensaje de confirmación si se ha reservado de forma correcta:

<img width="435" height="508" alt="image" src="https://github.com/user-attachments/assets/04e1935b-38b7-47e5-9270-76fc4789c789" />


> Cabe destacar que todas estas pantallas son bocetos y durante el desarrollo de este proyecto pueden tener variaciones, es decir, no son definitivas.


---


# Fase 2: Configuración del repositorio, pruebas unitarias y CI

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

Herramientas auxiliares y entornos de desarrollo (IDEs) empleados durante la construcción de la aplicación:

* **[IntelliJ IDEA](https://www.jetbrains.com/idea/):** Entorno de desarrollo integrado (IDE) avanzado utilizado para la programación y ejecución del servidor backend en Java/Spring Boot.
* **[Docker Desktop](https://www.docker.com/products/docker-desktop/):** Plataforma de virtualización a nivel de sistema operativo utilizada para aislar y desplegar servicios en contenedores (base de datos MySQL local y entornos de prueba).
* **[Postman](https://www.postman.com/):** Herramienta cliente HTTP para interactuar de forma aislada con la API REST y testear endpoints antes de la integración.
* **[GitHub](https://github.com/codeurjc-students/2026-YoSoyTuPadel):** Sistema de control de versiones distribuido empleado para el seguimiento del código fuente y el trabajo en ramas.

## Arquitectura
### API REST
La especificación técnica y documentación interactiva de la API REST se genera de forma automatizada mediante la integración de `springdoc-openapi-starter-webmvc-ui` y `springdoc-openapi-maven-plugin`, los cuales compilan la documentación de la API Rest en un documento OpenAPI v3 (`api-docs.yaml`) y posteriormente compilan la vista HTML con Redocly.

* **[Ver Documentación Interactiva de la API REST en HTML (vía RawGithack)](https://raw.githack.com/codeurjc-students/2026-YoSoyTuPadel/main/docs/api/api-docs.html)**


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

## Ejecucción y Edición de Código 
Esta sección detalla las instrucciones para clonar, configurar, ejecutar localmente y probar la aplicación **YoSoyTuPadel** partiendo desde el código fuente del repositorio.

### Clonado del Repositorio
Para obtener una copia local del proyecto, abre una terminal y ejecuta el siguiente comando:
```bash
git clone [https://github.com/tu-usuario/2026-YoSoyTuPadel.git](https://github.com/tu-usuario/2026-YoSoyTuPadel.git
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

### Uso de Herramientas
