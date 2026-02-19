import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { vendorChunks } from './src/build/vendorChunks.js';

// Custom plugin to handle JSON file saves during development
function jsonApiPlugin() {
  return {
    name: 'json-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-scenario', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const { scenario, data } = JSON.parse(body);

            if (!scenario || !data) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing scenario or data' }));
              return;
            }

            const validScenarios = ['midweek', 'live', 'playoffs'];
            if (!validScenarios.includes(scenario)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid scenario name' }));
              return;
            }

            const filePath = path.resolve(
              __dirname,
              `src/data/${scenario}.json`,
            );
            const jsonContent = JSON.stringify(data, null, 2);

            fs.writeFileSync(filePath, jsonContent, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                message: `Saved ${scenario}.json`,
              }),
            );
          } catch (err) {
            console.error('Error saving scenario:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsonApiPlugin()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunks,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  server: {
    proxy: {
      // Proxy ESPN API requests to avoid CORS issues in development
      '/espn-api': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/espn-api/, ''),
        secure: true,
        // Handle any errors gracefully
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('ESPN proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('ESPN API Request:', req.method, req.url);
          });
        },
      },
    },
  },
});
