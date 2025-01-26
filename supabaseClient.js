const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ghmmseeociswilopcurz.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobW1zZWVvY2lzd2lsb3BjdXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzg5NTAyNywiZXhwIjoyMDUzNDcxMDI3fQ.u5duShrPz3sUhjLYkrffPy5Q43qT4XtECj1a9gMaBxw"; // Înlocuiește cu cheia ta publică
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
