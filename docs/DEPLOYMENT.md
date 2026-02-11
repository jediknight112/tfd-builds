# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control

## Local Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

1. **Connect Repository**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub repository
   - Select `tfd-builds` repository

2. **Configure Build Settings**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (or leave empty)

3. **Environment Variables** (Optional)
   - Add any custom API URLs if needed
   - `VITE_API_BASE_URL` - Custom API base URL

4. **Deploy**
   - Click "Save and Deploy"
   - Your site will be live at `*.pages.dev`

5. **Custom Domain** (Optional)
   - Go to custom domains tab
   - Add your domain (e.g., `builds.example.com`)
   - Update DNS records as instructed

### Option 2: Netlify

1. **Connect Repository**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select `tfd-builds`

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Deploy**
   - Click "Deploy site"
   - Site will be available at `*.netlify.app`

### Option 3: Vercel

1. **Import Project**
   - Go to [Vercel](https://vercel.com/)
   - Click "New Project"
   - Import `tfd-builds` repository

2. **Configure**
   - Framework preset: Vite (auto-detected)
   - Root directory: `./`
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Deploy**
   - Click "Deploy"
   - Site live at `*.vercel.app`

### Option 4: GitHub Pages

1. **Build the Project**

```bash
npm run build
```

2. **Configure GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: Select branch with `dist` folder

3. **Push dist folder**

```bash
# Create gh-pages branch
git checkout -b gh-pages
git add dist -f
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
```

Alternatively, use GitHub Actions:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Option 5: Self-Hosted

1. **Build the Project**

```bash
npm run build
```

2. **Upload dist folder to your server**

```bash
# Using SCP
scp -r dist/* user@yourserver.com:/var/www/html/tfd-builds/

# Using rsync
rsync -avz dist/ user@yourserver.com:/var/www/html/tfd-builds/
```

3. **Configure Web Server**

**Nginx**:

```nginx
server {
    listen 80;
    server_name builds.yourdomain.com;

    root /var/www/html/tfd-builds;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

**Apache** (.htaccess):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Post-Deployment

### Verify Deployment

1. Visit your deployed URL
2. Open browser console (F12)
3. Check for any errors
4. Test descendant selection
5. Verify API calls are working

### Common Issues

**API CORS Errors**

- Ensure API allows requests from your domain
- Check CORS headers on API server
- Verify API base URL is correct

**Routing Issues (404 on refresh)**

- Configure server for SPA routing
- See web server configuration above

**Build Errors**

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Assets Not Loading**

- Check base path in `vite.config.js`
- Verify dist folder structure
- Check browser network tab for 404s

## Environment Configuration

Create `.env` file for custom configuration:

```env
VITE_API_BASE_URL=https://tfd-cache.jediknight112.com
VITE_LANGUAGE_CODE=en
```

**Note**: Environment variables must be prefixed with `VITE_` to be accessible in the app.

## Performance Optimization

### Enable Caching

Add cache headers in your web server configuration:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Enable Compression

Gzip/Brotli compression for faster loading:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### CDN (Optional)

- Enable Cloudflare CDN for faster global access
- Configure cache rules for static assets

## Monitoring

### Analytics (Optional)

Add to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking

Consider adding:

- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay

## Updating the Deployment

### Automatic Deployments

Most platforms (Cloudflare Pages, Netlify, Vercel) auto-deploy on git push:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

### Manual Deployment

```bash
# Rebuild
npm run build

# Re-deploy dist folder
# (follow steps for your hosting platform)
```

## Rollback

If deployment fails:

**Cloudflare Pages/Netlify/Vercel**:

- Go to deployments tab
- Click on previous successful deployment
- Click "Rollback to this deployment"

**GitHub Pages**:

```bash
git revert HEAD
git push
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] API keys not exposed in client code
- [ ] CORS properly configured
- [ ] Content Security Policy headers set
- [ ] Rate limiting on API if needed

## Support

For deployment issues:

- Check [Vite deployment docs](https://vitejs.dev/guide/static-deploy.html)
- Review platform-specific documentation
- Check browser console for errors
- Verify API connectivity

---

**Recommended Deployment**: Cloudflare Pages (free, fast, integrated with Cloudflare Workers for API)
