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
