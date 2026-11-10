FROM node:24-alpine AS web-build

WORKDIR /workspace
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

FROM dunglas/frankenphp:1-php8.3-bookworm

RUN install-php-extensions \
    bcmath \
    intl \
    opcache \
    pdo_pgsql \
    pdo_sqlite \
    zip \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

COPY . ./
COPY --from=web-build /workspace/dist/ /app/public/
COPY infrastructure/railway/Caddyfile /etc/caddy/Caddyfile

RUN php artisan package:discover --ansi \
    && mkdir -p \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
        /data/caddy \
        /config/caddy \
    && chown -R www-data:www-data storage bootstrap/cache /data /config

ENV APP_ENV=production \
    APP_DEBUG=false \
    SERVER_NAME=:8080

USER www-data

CMD ["sh", "-c", "php artisan migrate --force && exec frankenphp run --config /etc/caddy/Caddyfile"]
