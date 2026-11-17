import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isBackendConfigured = Boolean(url && anonKey);

/** `null` si faltan las variables VITE_SUPABASE_*; la app sigue funcionando offline con datos estáticos. */
export const supabase = isBackendConfigured ? createClient(url!, anonKey!) : null;
