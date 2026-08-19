-- ============================================================
-- Configuración de Supabase para "Papelería La Señora Cositas"
-- Copia y pega TODO este archivo en Supabase > SQL Editor > Run
-- ============================================================

-- 1) Tabla donde se guarda TODO el catálogo (productos, apartados, config)
create table if not exists store (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table store enable row level security;

-- Permite leer y escribir con la clave pública (anon).
-- Nota: igual que antes (el PIN de admin solo protege la pantalla, no la API),
-- así que cualquiera con el link técnicamente podría llamar a la API directo.
-- Es un nivel de seguridad aceptable para un catálogo pequeño, pero si más
-- adelante quieres bloquear esto de verdad, se puede agregar autenticación real.
create policy "Cualquiera puede leer el catálogo"
  on store for select
  using (true);

create policy "Cualquiera puede escribir el catálogo"
  on store for insert
  with check (true);

create policy "Cualquiera puede actualizar el catálogo"
  on store for update
  using (true);

-- 2) Bucket de almacenamiento para las imágenes de productos
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Cualquiera puede ver las imágenes"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Cualquiera puede subir imágenes"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

create policy "Cualquiera puede reemplazar imágenes"
  on storage.objects for update
  using (bucket_id = 'product-images');
