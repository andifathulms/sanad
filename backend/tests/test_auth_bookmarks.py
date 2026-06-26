"""JWT auth + owner-scoped bookmarks — the flow the frontend depends on."""
import pytest

pytestmark = pytest.mark.django_db


def _register_and_token(api, username="reader"):
    api.post(
        "/api/v1/auth/register/",
        {"username": username, "email": f"{username}@x.com", "password": "sanad-test-123"},
        format="json",
    )
    res = api.post(
        "/api/v1/auth/token/",
        {"username": username, "password": "sanad-test-123"},
        format="json",
    )
    assert res.status_code == 200, res.data
    return res.data["access"]


def test_register_then_token(api):
    token = _register_and_token(api)
    assert token


def test_me_requires_auth(api):
    assert api.get("/api/v1/auth/me/").status_code == 401


def test_bookmark_create_and_list(api, hadith):
    token = _register_and_token(api)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    created = api.post("/api/v1/bookmarks/", {"hadith": hadith.id}, format="json")
    assert created.status_code == 201

    listing = api.get("/api/v1/bookmarks/")
    assert listing.data["count"] == 1
    assert listing.data["results"][0]["hadith_detail"]["global_reference"] == "bukhari:1"


def test_bookmarks_are_owner_scoped(api, hadith):
    token_a = _register_and_token(api, "alice")
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token_a}")
    api.post("/api/v1/bookmarks/", {"hadith": hadith.id}, format="json")

    token_b = _register_and_token(api, "bob")
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token_b}")
    assert api.get("/api/v1/bookmarks/").data["count"] == 0  # bob sees none of alice's
