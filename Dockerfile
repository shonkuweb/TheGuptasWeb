FROM python:3.13-alpine AS build
WORKDIR /site
COPY build.py portfolio.py ./
COPY scripts/ ./scripts/
COPY dist/ ./dist/
ARG SITE_URL
RUN test -n "$SITE_URL" && SITE_URL="$SITE_URL" python build.py && python scripts/check.py

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /site/dist/ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
