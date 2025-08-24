import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ysqgklvtwrdqbdjrvkmo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzcWdrbHZ0d3JkcWJkanJ2a21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzQzMjYsImV4cCI6MjA3MTYxMDMyNn0.4cK2flxQ4ZDitNGZv0ehtP3CBLOWY5DcgGJJFdq-ask'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)