"""Shared HTTP helper for ingestion with rate limiting + 429 retry/backoff."""
from __future__ import annotations

import time

import requests
from django.conf import settings


def fetch_json(url: str, headers: dict | None = None) -> dict:
    """GET JSON, honoring INGEST_RATE_LIMIT_PER_SECOND and retrying on 429."""
    delay = 1.0 / max(settings.INGEST_RATE_LIMIT_PER_SECOND, 1)
    attempts = 0
    while True:
        attempts += 1
        resp = requests.get(url, headers=headers or {}, timeout=30)
        if resp.status_code == 429 and settings.INGEST_RETRY_ON_429:
            if attempts > settings.INGEST_MAX_RETRIES:
                resp.raise_for_status()
            backoff = delay * (2 ** attempts)
            time.sleep(backoff)
            continue
        resp.raise_for_status()
        time.sleep(delay)  # polite, fixed-rate throttle
        return resp.json()
