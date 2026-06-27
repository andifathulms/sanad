FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for psycopg + build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
ARG REQUIREMENTS=dev
RUN pip install --upgrade pip && pip install -r requirements/${REQUIREMENTS}.txt

COPY . .

# For prod images (REQUIREMENTS=prod), bake static files in — WhiteNoise serves
# them. The dummy env only lets settings import + collectstatic run; no DB or
# Redis is contacted during this step.
RUN if [ "$REQUIREMENTS" = "prod" ]; then \
      DEBUG=False SECRET_KEY=build-only ALLOWED_HOSTS=* \
      DATABASE_URL=postgres://u:p@localhost:5432/db REDIS_URL=redis://localhost:6379/0 \
      DJANGO_SETTINGS_MODULE=config.settings.production \
      python manage.py collectstatic --noinput; \
    fi

EXPOSE 8000
# Dev default; docker-compose.prod.yml overrides this with gunicorn.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
