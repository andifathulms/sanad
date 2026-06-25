"""Ingest narrator (rijal) metadata from the sunnah.com API.

Usage: python manage.py ingest_narrators --source=sunnah

Requires SUNNAH_COM_API_KEY. Deduplicates narrators by (death year + generation +
kunya) per CLAUDE.md, since the same narrator appears with different Arabic spellings.
This is a best-effort Phase 2 scaffold — sunnah.com narrator coverage is partial and
manual curation is expected to fill gaps.
"""
from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.isnad.models import Narrator
from scripts.ingest.http import fetch_json


class Command(BaseCommand):
    help = "Ingest narrator metadata from sunnah.com."

    def add_arguments(self, parser):
        parser.add_argument("--source", default="sunnah")
        parser.add_argument("--limit", type=int, default=0)

    def handle(self, *args, **opts):
        cfg = settings.HADITH_SOURCES["sunnah_com"]
        if opts["source"] != "sunnah":
            raise CommandError("Only --source=sunnah is supported.")
        if not cfg["api_key"]:
            raise CommandError("SUNNAH_COM_API_KEY is not set; cannot ingest narrators.")

        headers = {"X-API-Key": cfg["api_key"]}
        url = f"{cfg['base_url']}/narrators"
        created = 0
        page = 1
        while url:
            data = fetch_json(f"{url}?page={page}", headers=headers)
            for row in data.get("data", []):
                self._upsert(row)
                created += 1
                if opts["limit"] and created >= opts["limit"]:
                    url = None
                    break
            else:
                url = cfg["base_url"] + "/narrators" if data.get("next") else None
                page += 1
        self.stdout.write(self.style.SUCCESS(f"Upserted {created} narrators"))

    def _upsert(self, row: dict):
        kunya = row.get("kunya", "")
        death_ah = row.get("deathYearAH")
        generation = self._generation(row.get("grade", ""))
        # Dedup key: death year + generation + kunya
        Narrator.objects.update_or_create(
            kunya=kunya,
            death_year_ah=death_ah,
            generation=generation,
            defaults={
                "name_arabic": row.get("name", ""),
                "name_transliteration": row.get("transliteration", row.get("name", "")),
                "name_en": row.get("nameEn", row.get("name", "")),
                "region": row.get("region", ""),
                "reliability_grade": self._reliability(row.get("reliability", "")),
                "reliability_notes": row.get("reliabilityNotes", ""),
                "bio_source": row.get("bioSource", "sunnah.com"),
            },
        )

    @staticmethod
    def _generation(value: str) -> str:
        v = (value or "").lower()
        if "companion" in v or "sahab" in v:
            return "sahabi"
        if "successor" in v or "tabi" in v:
            return "tabii"
        return "unknown"

    @staticmethod
    def _reliability(value: str) -> str:
        v = (value or "").lower()
        for key in ("thiqah", "saduq", "daif", "majhul", "matruk"):
            if key in v:
                return key
        return "unknown"
