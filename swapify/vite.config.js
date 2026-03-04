import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env files
  const env = loadEnv(mode, process.cwd(), '')
  
  // Make REACT_APP_ variables available to import.meta.env
  const envWithReactPrefix = Object.keys(env).reduce((acc, key) => {
    if (key.startsWith('REACT_APP_')) {
      acc[`import.meta.env.${key}`] = JSON.stringify(env[key])
    }
    return acc
  }, {})

  return {
    plugins: [react()],
    define: envWithReactPrefix
  }
})