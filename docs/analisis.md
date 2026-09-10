# Análisis y Entidades

## Entidades de la aplicación

| Entidad | Descripción | Acciones |
| :--- | :--- | :--- |
| **User (Usuario)** | Almacena toda la información sobre un usuario específico en la plataforma, podrá hacer y cancelar reservas y alquilar palas. Puede ser de los siguientes tipos: Usuario no registrado, Alumno, Entrenador o Administrador | - Registrarse (Usuario no registrado)<br> - Iniciar sesión<br>- Cerrar sesión<br>- Editar perfil<br>- Eliminar usuario |
| **Racket (Pala)** | Representa las palas de la academia disponibles para alquiler, opcionalmente, el usuario puede llevar su propia pala también. (tanto para reserva de pista como para entrenamientos)| - Alquilar pala<br>- Ver detalles <br> Para el admin :<br> - Editar detalles<br>- Eliminar pala  |
| **Court (Pista)** | Representa las instalaciones físicas de las pistas de pádel en el club. | - Ver detalles <br> Para el admin :<br> - Crear pista<br>- Eliminar pista<br>- Editar pista |
| **Booking (Reserva)** | Vincula a un usuario alumno y una pista en una fecha y un intervalo de tiempo concretos. | - Crear reserva<br>- Cancelar reserva  |

### Diagrama inicial de clases

<img width="920" height="573" alt="DiagramaDeClasesInicial" src="https://github.com/user-attachments/assets/bd4d9a4f-d187-4469-ba4e-02d63e52b1a4" />

## 🖼️ Imágenes

La aplicación será capaz de gestionar imágenes subidas por los usuarios para personalizar la interfaz de perfil de usuario:
* Los usuarios alumnos pueden subir una foto de perfil, tanto subir una nueva si no se tiene, como modificar una ya presubida.
* De igual forma, los entrenadores podrán hacer lo mismo que los usuarios alumno, pero estas podrán ser vista por los alumnos a la hora de buscar en el catálogo de entrenadores.

Cada entidad pala incluirá una fotografía en el catálogo, la cual se encargará de subir el administrador para que los alumnos conozcan el modelo real que van a alquilar.

## 📈 Gráficos

* **Gráficos de líneas:** Cada usuario alumno tendrá en su perfil un gráfico de la progresión de su nivel a lo largo de los entrenamientos, subiendo o bajando de puntuación dependiendo de su desempeño en los entrenos y la valoración que le asigne el entrenador correspondiente.

## 🛠️ Tecnologías complementarias

* **Integración de Mapas (Google Maps / OpenStreetMap API):** Se utilizará una API de mapas interactivos en la pantalla de los detalles de una pista para posicionarla geográficamente, lo que permitirá mostrar de manera precisa la ubicación de las pistas e instalaciones del club mediante marcadores personalizados.

## 🤖 Algoritmo o consulta avanzada

El usuario podrá filtrar a su gusto las pistas que le aparecen en el catálogo de pistas, ya sea por precio, tipo, tipo de paredes o valoraciones (las pistas estarán valoradas por una calificación) mediante un filtrado dinámico multicriterio en tiempo real.