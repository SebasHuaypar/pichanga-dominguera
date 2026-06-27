# Pichanga Dominguera
¡Bienvenidos a la plataforma definitiva para la gestión de torneos de barrio! **Pichanga Dominguera** es una aplicación web moderna diseñada para llevar la emoción del fútbol local al siguiente nivel, con actualizaciones en tiempo real y un diseño premium.

![Logo Vecinos](/public/images/logo_vecinos.svg)

## Características Principales

- **Sorteo en Vivo (Real-time):** Animación de ruleta sincronizada para todos los usuarios. ¡El azar se vive en directo!
- **Tabla de Posiciones Dinámica:** Recálculo automático de puntos, goles y posiciones al finalizar cada partido.
- **Fixture Inteligente:** Generación secuencial de partidos concentrados en una sola jornada (8:30 AM - 11:30 AM).
- **Transición Automática:** El sistema detecta el fin de un partido y activa automáticamente el siguiente como "En Vivo".
- **Reportes PDF:** Generación de informes profesionales con la tabla de clasificación y el fixture detallado para descargar y compartir.
- **Panel de Administración:** Gestión completa de equipos (activar/desactivar), edición de marcadores y control del ciclo de vida del campeonato.
- **Responsive Design:** Optimizado para que el árbitro actualice los goles desde su celular en plena cancha.

## Stack Tecnológico

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime)
- **Estilos:** CSS Vanilla + Tailwind CSS
- **Animaciones:** Framer Motion
- **PDF:** jsPDF + autoTable
- **Iconos:** React Icons (Hi2)

## Configuración e Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/SebasHuaypar/pichanga-dominguera.git
   cd pichanga-dominguera
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Variables de Entorno:**
   Crea un archivo `.env.local` en la raíz con tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_llave_anon_de_supabase
   ```

4. **Base de Datos:**
   Asegúrate de tener las tablas `teams`, `matches` y `draw_status` configuradas en Supabase y activa la publicación Realtime:
   ```sql
   alter publication supabase_realtime add table matches, draw_status, teams;
   ```

5. **Correr en local:**
   ```bash
   npm run dev
   ```

## Algoritmo de Fixture Inteligente (Mejorado)

El sistema cuenta con un generador de cruces inteligente ([fixture-generator.ts](./src/lib/fixture-generator.ts)) diseñado para estructurar la jornada de manera justa y dinámica.

En su versión anterior, el ordenamiento aleatorio-greedy de los partidos podía generar largas esperas para algunos equipos (un equipo esperando hasta 6 partidos seguidos sin jugar). La versión actual ha sido **optimizada** mediante un resolvedor de búsqueda inteligente (Backtracking con poda recursiva) que garantiza matemáticamente el menor descanso posible para cada caso:

- **6 Equipos (15 partidos):** Garantiza **0 partidos seguidos** (sin back-to-back) y un descanso máximo de exactamente **3 partidos** por equipo entre sus juegos. Este es el límite físico matemático óptimo para esta cantidad de equipos.
- **5 Equipos (10 partidos - 1 descansa por fecha):** Garantiza **0 partidos seguidos** y un descanso máximo de exactamente **2 partidos** por equipo.
- **4 Equipos (6 partidos):** En esta cantidad de equipos, evitar partidos seguidos por completo es imposible (genera un bloqueo de cruces). El algoritmo detecta esto y automáticamente activa un fallback dinámico que encuentra la solución óptima: solo **2 partidos seguidos en todo el torneo** y un descanso máximo de **2 partidos**.

### ¿Cómo funciona la búsqueda inteligente?
1. Genera de forma aleatoria la lista de cruces Round Robin.
2. Inicia una búsqueda recursiva paramétrica, probando de forma incremental límites óptimos de partidos consecutivos permitidos (`maxBackToBacks`) y descanso consecutivo máximo (`maxRest`).
3. Aplica **poda temprana en el árbol de búsqueda**: si más de dos equipos ya superaron su límite de descanso acumulado en una rama del fixture, el resolvedor retrocede instantáneamente. Esto reduce la complejidad computacional, permitiendo resolver cualquier número de equipos en **menos de 1 milisegundo**.

## Estética y UX

La aplicación utiliza una paleta de colores **Dark Mode** con acentos en **Rojo Vibrante (#FF3B3B)**, tipografía **Outfit** para un look deportivo y moderno, y efectos de **glassmorphism** para una experiencia de usuario premium.

---
## Author

<div align="center">

### Sebastián Huaypar Acurio

Computer Science Student @ UNI  
AI, Data Science & Analytics Engineering Enthusiast. Making websites just for fun  
[LinkedIn](https://www.linkedin.com/in/sebashuaypar)

</div>
