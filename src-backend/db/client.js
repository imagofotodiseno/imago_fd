import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Exportamos el cliente para usarlo en controladores y servicios
export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;