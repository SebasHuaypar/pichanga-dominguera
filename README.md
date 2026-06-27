# Pichanga Dominguera
¡Bienvenidos a la plataforma definitiva para la gestión de torneos de barrio! **Pichanga Dominguera** es una aplicación web moderna diseñada para llevar la emoción del fútbol local al siguiente nivel, con actualizaciones en tiempo real y un diseño premium.

![Logo Vecinos](/public/images/logo_vecinos.svg)

## Características Principales

- **Sorteo en Vivo (Real-time):** Animación de ruleta sincronizada para todos los usuarios. ¡El azar se vive en directo!
- **Tabla de Posiciones Dinámica:** Recálculo automático de puntos, goles y posiciones al finalizar cada partido.
- **Fixture Inteligente:** Generación secuencial de partidos concentrados en una sola jornada (8:30 AM - 11:30 AM).
- **Actualización Automática:** El sistema detecta el marcador ingresado y actualiza el estado del partido a "Finalizado" y la tabla de posiciones de forma instantánea.
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

## Algoritmo de Fixture por Rondas (Mejorado)

El sistema cuenta con un generador de cruces inteligente ([fixture-generator.ts](./src/lib/fixture-generator.ts)) diseñado para estructurar la jornada de manera justa, balanceada y ordenada por rondas.

El fixture se genera siguiendo un orden estrictamente cronológico por rondas (Ronda 1, Ronda 2, Ronda 3, etc.), garantizando los siguientes criterios:

- **Distribución Balanceada de Inicio:** En cada ronda, todos los equipos activos juegan exactamente una vez (en caso de número par de equipos). Por ejemplo, con 6 equipos, los primeros 3 partidos de la jornada corresponderán a la Ronda 1, garantizando que todos los equipos debuten en la cancha de inmediato.
- **Prevención de Partidos Seguidos (Back-to-Back):** En la transición de una ronda $r-1$ a la ronda $r$, el algoritmo selecciona como primer partido de la ronda $r$ un cruce cuyos equipos **no hayan jugado en el último partido de la ronda anterior**. Esto evita que un equipo juegue de forma consecutiva.
- **Eficiencia Matemática:** La lógica agrupa los encuentros por ronda y acomoda el primer partido mediante una búsqueda lineal simple basada en la exclusión de los últimos participantes, ejecutándose de forma instantánea y robusta.

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
