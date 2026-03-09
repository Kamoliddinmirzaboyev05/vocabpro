import { createClient } from "@supabase/supabase-js";
// Use relative path to import from root utils
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);
