/**
 * Vite/Rollup manualChunks function that splits heavy vendor
 * libraries into separate cacheable bundles.
 */
export function vendorChunks(id) {
  if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
    return 'vendor-recharts';
  }
  if (id.includes('node_modules/framer-motion')) {
    return 'vendor-framer-motion';
  }
  if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router')) {
    return 'vendor-react-router';
  }
}
