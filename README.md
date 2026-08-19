# Papelería La Señora Cositas — Catálogo en línea

## ¿Qué pasaba antes?

La tienda **funcionaba con dos partes**: la página que se ve (React) y un
"servidor" (Express, `server.ts`) que guardaba los productos, apartados e
imágenes en un archivo en el disco.

El problema: **Netlify solo publica la página, no ejecuta ese servidor.**
Entonces, cada vez que agregabas, editabas o borrabas algo, la app intentaba
avisarle al servidor... pero el servidor no existía ahí. Como no había un
mensaje de error visible, la app se quedaba callada y solo guardaba el
cambio *temporalmente en la memoria de tu navegador* — por eso al recargar
la página (o entrar desde el celular, u otra persona) todo volvía a como
estaba antes.

## ¿Qué se arregló?

Se reemplazó ese servidor por **Supabase**, un servicio gratuito de base de
datos en la nube. Ahora, cuando agregas un producto, subes una imagen, o
registras un apartado, la app guarda todo directo en Supabase — desde
cualquier navegador, celular o computadora, y se queda ahí para siempre
(hasta que tú lo cambies).

También se corrigió que la app **avise con un mensaje claro** si algo no se
pudo guardar, en vez de fingir que sí se guardó.

## Cómo dejarlo funcionando (una sola vez, ~10 minutos)

### 1. Crea tu cuenta de Supabase (gratis)

1. Ve a https://supabase.com y crea una cuenta gratis.
2. Crea un proyecto nuevo (elige cualquier nombre y contraseña, no importa
   cuál, guárdala en un lugar seguro).
3. Espera 1-2 minutos a que el proyecto termine de crearse.

### 2. Crea la tabla y el almacenamiento de imágenes

1. Dentro de tu proyecto, ve al menú **SQL Editor** (ícono de `</>`).
2. Abre el archivo `supabase_setup.sql` que viene en esta carpeta, copia
   **todo** su contenido, y pégalo en el editor de Supabase.
3. Dale clic a **Run**. Deberías ver "Success. No rows returned".

### 3. Copia tus claves

1. Ve a **Project Settings** (ícono de engranaje) > **API**.
2. Copia el valor de **Project URL**.
3. Copia el valor de **anon public** (la llave pública, no la "service role").

### 4. Configúralas en Netlify

1. En Netlify, entra a tu sitio > **Site configuration** > **Environment variables**.
2. Agrega dos variables:
   - `VITE_SUPABASE_URL` → pega tu Project URL
   - `VITE_SUPABASE_ANON_KEY` → pega tu anon public key
3. Ve a **Deploys** y dale **Trigger deploy > Deploy site** para que Netlify
   vuelva a publicar la página con las nuevas variables.

### 5. Sube este código a tu repositorio (GitHub/GitLab) que Netlify está usando

Reemplaza los archivos de tu repositorio con los de esta carpeta (o si
prefieres, dime y te ayudo a preparar el paquete listo para subir). Cuando
Netlify detecte el cambio, va a reconstruir el sitio automáticamente.

¡Listo! A partir de ahí, cada producto, imagen y apartado que agregues desde
el panel de administración se va a guardar de forma permanente y va a
aparecer igual en cualquier dispositivo.

## Correrlo en tu computadora (opcional, para probar antes de subir)

1. Instala [Node.js](https://nodejs.org) si no lo tienes.
2. Crea un archivo `.env.local` en esta carpeta (copia `.env.example` y
   pon ahí tus claves reales de Supabase).
3. En una terminal, dentro de esta carpeta:
   ```
   npm install
   npm run dev
   ```
4. Abre http://localhost:5173 en tu navegador.

## Nota sobre seguridad

El PIN de administrador (`adminPin` en Configuración) solo protege que se
*vea* el panel de administración en el navegador — es el mismo nivel de
protección que tenía la app antes. No es una contraseña de servidor real.
Para un negocio pequeño esto suele ser suficiente, pero si más adelante
quieres una protección más fuerte (usuarios y contraseñas de verdad), se
puede agregar con el sistema de autenticación de Supabase.
