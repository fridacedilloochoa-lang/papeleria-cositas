import { createClient } from '@supabase/supabase-js';

// Estas dos variables se configuran en Netlify (Site settings > Environment variables)
// y en tu archivo .env.local para desarrollo. Ver README.md para la guía paso a paso.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // No lanzamos error para no romper el build, pero avisamos claramente en consola.
  console.error(
    '⚠️ Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY ' +
    '(en Netlify: Site settings > Environment variables, y localmente en .env.local). ' +
    'Sin esto, los cambios NO se van a guardar.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const STORE_ROW_ID = 'main';
export const UPLOADS_BUCKET = 'product-images';
