const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Remove crossorigin attributes from script and link tags
  html = html.replace(/\s+crossorigin/g, '');
  
  // Add build timestamp as a meta tag for cache busting
  const buildTimestamp = Date.now();
  const buildVersion = process.env.BUILD_VERSION || buildTimestamp;
  
  // Add version meta tag before closing head tag
  if (!html.includes('data-build-version')) {
    html = html.replace(
      '</head>',
      `<meta name="build-version" content="${buildVersion}" data-build-version="true" />\n</head>`
    );
  }
  
  // Also add a comment with build time for debugging
  const buildDate = new Date().toISOString();
  html = html.replace(
    '<!doctype html>',
    `<!doctype html>\n<!-- Build: ${buildDate} (${buildVersion}) -->`
  );
  
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`✓ Removed crossorigin attributes and added build version (${buildVersion}) to index.html`);
} else {
  console.error('index.html not found at:', indexPath);
  process.exit(1);
}

