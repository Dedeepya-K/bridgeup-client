import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://bridgeup-server-production.up.railway.app'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://rbugirsummjzawyesasl.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidWdpcnN1bW1qemF3eWVzYXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTI1NTUsImV4cCI6MjA5MDg2ODU1NX0.2ZUDp75_-5Y9i-UPpxSgm8NtpAUxUrP4_V5s_vQmaq4'),
  }
})