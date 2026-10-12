# Funcionalidades y Roles de Usuario

## Funcionalidad para Tipos de Usuario
- Usuario No Registrado: Podrá entrar en la página principal de la aplicación y podrá ver tanto el catálogo de palas, la lista de entrenadores y la lista de pistas disponibles, pero no podrá hacer uso de los servicios de la academia. Es decir, no podrá alquilar palas, no podrá contratar entrenadores ni reservar pistas, y obviamente no podrá entrar en la pantalla de perfil de usuario.
- Usuario Registrado (Alumno): Podrá hacer lo mismo que el usuario no registrado pero teniendo acceso a los servicios de la plataforma tales como alquilar una pala, contratar a un entrenador, reservar una pista o entrar en su perfil, pudiendo modificarlo o incluso eliminar su cuenta.
- Entrenador: El entrenador tendrá la capacidad para modificar el nivel de un alumno después de un entrenamiento con el mismo. De igual forma que el usuario, podrá entrar en su perfil con las mismas capacidades.
- Administrador: El administrador podrá acceder a todas las pantallas de la aplicación y modificar el catálogo de palas y pistas. También tendrá la capacidad para modificar el nivel de un alumno o incluso eliminar su usuario.

## 🔐 Permisos de usuario

La siguiente tabla detalla los permisos de los usuarios para las acciones principales de la web. Cabe destacar que todas las transacciones financieras se gestionan físicamente en la sede de la academia. También cabe destacar que algunas acciones no estén disponibles porque no tienen sentido en el contexto del negocio, como por ejemplo que un administrador alquile una pala.

| Acción | Anónimo | Registrado (Alumno) | Entrenador | Administrador |
| :--- | :--- | :--- | :--- |:--- |
| **Ver página de inicio / Info** | sí | sí | sí | sí |
| **Ver página de palas, entrenadores o pistas** | sí | sí | sí | sí |
| **Reservar pista / Alquilar pala / Contratar entrenador** | no | sí | no | no |
| **Modificar nivel de un alumno** | no | no | sí | sí |
| **Gestionar catálogo de palas y pistas (CRUD)**| no | no | no | sí |
| **Ver / Modificar / Eliminar - Perfil** | no | sí | sí | sí |

## ⚙️ Funcionalidades Detalladas

A continuación se detalla la lista de funcionalidades de la aplicación, indicando su estado de implementación en la versión 0.1.

### ✅ Funcionalidades Implementadas (Versión 0.1)

Las funcionalidades básicas del sistema ya se encuentran completamente operativas en la plataforma, abarcando tanto la visualización pública como las operaciones transaccionales y de gestión integral.

1. **Autenticación y Gestión de Perfiles:**
   
   Sistema de registro e inicio de sesión seguro. Los usuarios registrados pueden acceder a su panel de perfil, modificar su información personal o eliminar su cuenta de la plataforma.
   * Pantalla de registro
     
     <img width="1261" height="855" alt="image" src="https://github.com/user-attachments/assets/150bb9c3-7d18-4c34-a1e1-36e17124d459" />

   * Pantalla de inicio de sesión
     
     <img width="1316" height="810" alt="image" src="https://github.com/user-attachments/assets/b69f022a-3176-4b78-bdbc-cc79004701d2" />

   * Pantalla de perfil
     
     <img width="1348" height="857" alt="image" src="https://github.com/user-attachments/assets/d8125928-1374-4a70-806f-311a3f244895" />

   * Pantalla de edición de perfil
  
     <img width="1331" height="827" alt="image" src="https://github.com/user-attachments/assets/aa9d894a-425f-40e0-a022-5c4c1c4b029f" />



2. **Gestión Administrativa de Pistas y Palas (CRUD Completo):**
   
   El sistema cuenta con control total de inventario e instalaciones. Además de la visualización, el rol de Administrador puede crear nuevas pistas y palas, Actualizar sus características (precio, imágenes, tipo) y eliminar registros del catálogo para mantener la oferta de la academia actualizada. De igual forma, tendrá un padel donde controlar tanto a los usuarios (pudiendo editarlos o eliminarlos) como las todas las reservas realizadas hasta el momento, pudiendo cancelarlas o eliminarlas.
   * Pantalla del panel de administración de un administrador (Usuarios)

     <img width="1012" height="866" alt="image" src="https://github.com/user-attachments/assets/7e8dd806-e7a3-4f98-8f9f-b8bb92f29d51" />


   * Pantalla del panel de administración de un administrador (Reservas)

     <img width="1041" height="907" alt="image" src="https://github.com/user-attachments/assets/eb6a0ad5-4f8f-4f3c-b923-618b849c6274" />


   * Pantalla de creación de una pala
  
     <img width="1372" height="907" alt="image" src="https://github.com/user-attachments/assets/015d60e2-e723-4961-91a5-41bf3be6b769" />

  
   * Pantalla de edición de una pala

     <img width="1352" height="782" alt="image" src="https://github.com/user-attachments/assets/30df4a9e-1676-4b45-98bb-9e4363b3b987" />

  
   * Pantalla de creación de una pista

     <img width="1322" height="902" alt="image" src="https://github.com/user-attachments/assets/49e20418-b768-4813-9a60-125f3230a353" />

  
   * Pantalla de edición de una pista
  
     <img width="1296" height="761" alt="image" src="https://github.com/user-attachments/assets/66d406e7-d09b-49f5-a8cc-678bd0711dfe" />

  
   * Pantalla de edición de un usuario (Entrenador en este caso)
  
     <img width="1358" height="902" alt="image" src="https://github.com/user-attachments/assets/d232ae60-585e-4f46-954d-e1397cb8efb6" />
     
    

3. **Operaciones Principales (Reservas):**
   
   El núcleo transaccional está funcional. Los alumnos pueden agendar reservas de pistas comprobando la disponibilidad en tiempo real, alquilar palas directamente desde el catálogo y contratar sesiones con los entrenadores disponibles. Se podrá reservar cualquier dia de las proximas dos semanas y en unas franjas horarias dependiendo si es una pista o un entrenamiento, ya que las pistas se alquilan en intervalos de una hora, mientras que con los entrenadores se reservan en intervalos de dos horas. Los alumnos también tendrán una pantalla donde ver todas sus reservas por tipos y podrán cancelarlas a su gusto.
   
   * Pantalla de reserva de una pista
  
     <img width="1337" height="711" alt="image" src="https://github.com/user-attachments/assets/2716fab0-61e0-4463-8aa5-868bf2795b1c" />


   * Pantalla de reserva de un entrenador
  
     <img width="1355" height="792" alt="image" src="https://github.com/user-attachments/assets/04818303-7732-48b5-8669-dbac2df38b51" />


   * Pantalla de reserva de una pala
  
     <img width="1370" height="651" alt="image" src="https://github.com/user-attachments/assets/8b6e82f1-1a50-4536-80bb-3eabfba3c8dc" />


   * Pantalla de reservas de un usuario alumno
  
     <img width="1210" height="890" alt="image" src="https://github.com/user-attachments/assets/4ccda76a-f4cd-45f8-bedf-548369438d5e" />



4. **Visualización Pública de Catálogos:**
   
   Cualquier cliente (registrado o anónimo) puede explorar de forma visual la lista completa de palas, la plantilla de entrenadores y la lista de las pistas existentes. Exigiendolé iniciar sesión si se desean ver los detalles.
   * Catálogo de Palas

     <img width="1022" height="902" alt="image" src="https://github.com/user-attachments/assets/1bb10ac9-c9f7-4d1d-85a0-d9edeb093b78" />


   * Catálogo de Pistas

     <img width="1021" height="903" alt="image" src="https://github.com/user-attachments/assets/98f67a90-b414-4bd5-adfd-9d169d16d94d" />


   * Lista de entrenadores
  
     <img width="1032" height="902" alt="image" src="https://github.com/user-attachments/assets/6d7d7a38-5c5c-4921-9eaa-39eb1a65114b" />


### ⏳ Funcionalidades Pendientes de Implementación

Las siguientes operaciones se desarrollarán en futuras iteraciones del proyecto.

#### Intermedias Pendientes
* **Gestión de Nivel:** Permite a los usuarios con rol de **Entrenador** evaluar a los jugadores que han asistido a sus entrenamientos. El entrenador dispondrá de la capacidad de modificar el nivel del alumno para ajustarlo a su desempeño real, incluyendo la posibilidad de bajarle el nivel técnico en la plataforma si se considera necesario.
* **Nivelación inicial:** Permite a los usuarios iniciantes o no registrados en la aplicación adquirir un nivel inicial al registrarse, asignándoles un nivel determinado dependiendo de las respuestas del mismo a una serie de preguntas.

#### Avanzadas Pendientes
* **Sistema de Filtrado de Pistas:** Implementación de un filtro de búsqueda dinámico en la selección de pistas a reservar. Los usuarios podrán filtrar las pistas disponibles en tiempo real según distintos criterios como el precio o el tipo de pista (al aire libre o techado).

## 💻 Boceto de pantallas (Fase de Diseño)

> Cabe destacar que todas estas pantallas son bocetos y durante el desarrollo de este proyecto pueden tener variaciones, es decir, no son definitivas.

### Pantalla de inicio de sesión o registro 
En estas pantallas, los usuarios podrán iniciar sesión para hacer uso de los servicios que ofrece la aplicación de la academia o, por el contrario, registrarse si son usuarios no registrados: 
- Para el inicio de sesión: 

<img width="1912" height="855" alt="image" src="https://github.com/user-attachments/assets/fbeb4318-e6bd-4a72-95bb-54fadc8923dc" />

- Para el registro: 

<img width="1915" height="860" alt="image" src="https://github.com/user-attachments/assets/0d6f8fb5-9dd9-4ac1-ac0a-57d35a76b4e9" />

Tras introducir los datos de registro el nuevo alumno responderá una serie de preguntas para determinar su nivel inicial. En dicho cuestionario también habrá la posibilidad de cancelar el registro, pasar a la siguiente pregunta o finalizar registro.
A continuación se muestran dos bocestos de ejemplo: 

<img width="596" height="817" alt="image" src="https://github.com/user-attachments/assets/9c081a32-bd78-46a5-b5c5-2edfc1cb5b3c" />

<img width="598" height="775" alt="image" src="https://github.com/user-attachments/assets/2057478d-1b65-4d19-9520-19e97d21e2af" />

### Pantalla del Menú Principal
Desde esta pantalla se podrá acceder al catálogo de palas de alquiler, la lista de entrenadores para contratar y la reserva de pistas. De igual forma, si el usuario es un alumno o un profesor, se podrá acceder a la pantalla del perfil de usuario. Adicionalmente, se incluirá el nombre del usuario, la fecha actual y la fecha y hora del próximo entreno que haya contratado:

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
En esta vista se mostrarán todas las pistas disponibles con una vista previa de su ubicación (aunque en este caso se pone una foto genérica hasta su implementación), nombre, tipo, precio por hora y si hay destacadas. De forma similar a la pantalla del catálogo de palas, el usuario podrá ver sus detalles antes de reservarla. También se podrá volver al menú principal. En esta ventana el administrador podrá crear nuevas pistas, o modificar o eliminar las existentes:

<img width="1073" height="863" alt="image" src="https://github.com/user-attachments/assets/f82ce3b9-d181-405a-8d62-cc3bff0142f8" />

### Pantalla de disponibilidad, detalles y reserva de una pista
Si un usuario quiere reservar una pista, tras clickar en el botón de disponibilidad de la pista correspondiente de la lista de pistas disponible podrá ver detalles más especificos de la pista. También podrá seleccionar una hora determinada de un día elegido a su elección y finalizar la reserva. De igual forma podrá cancelar y volver al catálogo de pistas. 

<img width="547" height="840" alt="image" src="https://github.com/user-attachments/assets/6e85936c-818c-4a3f-9a27-13808cd01ad3" />

Tras finalizar la reserva de la pista el usuario podrá ver un mensaje de confirmación si se ha reservado de forma correcta:

<img width="435" height="508" alt="image" src="https://github.com/user-attachments/assets/04e1935b-38b7-47e5-9270-76fc4789c789" />
