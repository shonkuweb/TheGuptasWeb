# The Gupta’s Landscape

Complete static website: 11 pages, six editorial portfolio collections, supplied photographs, transparent gold logo, galleries, filters, animations and a project-brief builder. Images are stored in `dist/assets/` and shipped inside the Docker image. Google Fonts are fetched externally, with system-font fallbacks.

## Docker deployment on a shared VPS

This is a standalone Compose project named `theguptasweb`. It does not claim public ports 80/443, mount host directories, run a database, or modify other projects. A non-root Nginx container serves the site on a configurable **localhost-only** port (`18081` by default). Your existing reverse proxy handles the domain and HTTPS.

Prerequisites: Git, Docker Engine and the Docker Compose plugin on the VPS. Use your existing server administration process for installation; do not replace its reverse proxy.

### 1. Clone and configure

Use a new directory, separate from all other live projects:

```bash
git clone https://github.com/shonkuweb/TheGuptasWeb.git
cd TheGuptasWeb
cp .env.example .env
```

Edit `.env`:

```dotenv
SITE_URL=https://your-domain.com
HTTP_PORT=18081
```

Use your actual HTTPS domain with no trailing slash. The build generates canonical and social-sharing URLs for that domain. `.env` is ignored by Git. Check that the chosen port is unused before starting (`ss -ltn`); change `HTTP_PORT` if occupied. Keep the same project name and directory for future updates.

### 2. Build and start only this project

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:18081/healthz
```

Replace `18081` in checks and proxy settings if you chose another port. The Python build stage regenerates and validates all pages; the runtime image contains Nginx and the complete static site. It has a health check, restart policy, read-only filesystem, temporary writable storage and bounded resources/logs. No Docker socket or host networking is used.

### 3. Add your domain to the existing reverse proxy

Point the domain's DNS A record to the VPS. Add AAAA only if public IPv6 already works. Keep the server's existing routing and firewall arrangements.

**Host-based Caddy:** add the block from `deploy/Caddyfile.example`, changing the domain and port. Preserve existing site blocks, validate the combined config, then reload Caddy through the server's normal procedure. Caddy can manage HTTPS when DNS and connectivity are correct.

**Host-based Nginx:** use `deploy/nginx-proxy.conf.example` as a new, separate site block. It is an HTTP starting point; add HTTPS through your existing certificate workflow. Run `nginx -t` before reloading. Never overwrite another site's config.

**Docker-based Traefik, Nginx Proxy Manager or Caddy:** do not point the proxy container at `127.0.0.1` (that is the proxy container itself). Adapt this service to join the existing proxy's external Docker network, use a unique network alias such as `theguptasweb`, and route to that alias on port `8080`. Labels and network names depend on your actual proxy. The included Compose file deliberately does not guess or modify that shared setup.

Do not start another public proxy on ports 80/443. The domain and the VPS's existing proxy configuration must be known before configuring the live route. This repository does not deploy to or change your VPS automatically.

### 4. Verify

```bash
python3 scripts/check_http.py http://127.0.0.1:18081
```

This checks all served pages and files, image MIME types, exact image bytes and a real 404 response. Also visit your HTTPS domain and test mobile navigation, project filters, enlarged galleries and the project-brief download.

### 5. Update

From this project's directory:

```bash
git pull --ff-only
docker compose up -d --build
docker compose ps
```

Changing `SITE_URL` requires rebuilding. Only this Compose project's service is replaced. Avoid server-wide prune/stop commands. To stop this site alone, run `docker compose down` from its directory.

The GitHub Actions workflow builds and smoke-tests the Docker image on pushes and pull requests. It does not SSH to the VPS or publish/deploy anything. Base images use maintained version/channel tags; production operators can pin approved image digests through their normal update process.

## Source guide

- `build.py`: main pages and shared layout.
- `portfolio.py`: six collections, captions and gallery pages.
- `dist/style.css`, `dist/app.js`: styling and interactions; these are source assets, so retain them.
- `dist/assets/`: local photography and logo assets.
- `Dockerfile`, `compose.yaml`, `deploy/nginx.conf`: container build and serving configuration.
- `scripts/check.py`: validates page links, images, anchors, headings and IDs.
- `scripts/check_http.py`: deployed HTTP validation.

To preview without Docker:

```bash
SITE_URL=https://example.com python3 build.py
python3 scripts/check.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. The site expects the root of a domain, not a GitHub Pages repository subpath. Python uses only the standard library.

## Content and enquiry behavior

Photos are organized by visible design theme; collection titles are editorial, not invented client names or verified individual project identities. Some additional photos are retained without being featured.

The contact form creates a copyable/downloadable project brief. **It does not send email, send WhatsApp messages or store submissions.** Supply a real business contact destination or integrate a backend before using it to receive enquiries.

## References

- Docker Compose networking: https://docs.docker.com/compose/how-tos/networking/
- Docker Compose port bindings: https://docs.docker.com/reference/compose-file/services/#ports
- Nginx unprivileged image: https://github.com/nginx/docker-nginx-unprivileged
