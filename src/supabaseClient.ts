// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ' https://zqgtetcojmqjlkgmrqxm.supabase.co ';
const supabaseKey = ' eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZ3RldGNvam1xamxrZ21ycXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTMxMzQsImV4cCI6MjA4Mjg2OTEzNH0.cLwztsUdIYp2ORH0cYegJL9-YIP547V9MI8Lwu6DJaE ';

export const supabase = createClient(supabaseUrl, supabaseKey);