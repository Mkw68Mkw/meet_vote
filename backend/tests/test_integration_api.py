from __future__ import annotations

from datetime import timedelta

from flask_jwt_extended import create_access_token

from tests.doubles import PollPayloadDouble, UserCredentialsDouble, VotePayloadDouble


def _register_and_login(client, prefix: str = "itest_user") -> tuple[UserCredentialsDouble, str]:
    credentials = UserCredentialsDouble.unique(prefix=prefix)

    register_response = client.post("/auth/register", json=credentials.as_payload())
    assert register_response.status_code == 201

    login_response = client.post("/auth/login", json=credentials.as_payload())
    assert login_response.status_code == 200
    token = login_response.get_json()["access_token"]
    return credentials, token


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_register_login_and_me_integration(client):
    credentials, token = _register_and_login(client)

    me_response = client.get("/auth/me", headers=_auth_headers(token))

    assert me_response.status_code == 200
    payload = me_response.get_json()
    assert payload["username"] == credentials.username
    assert isinstance(payload["id"], int)


def test_me_rejects_expired_access_token_integration(client):
    from main import app

    credentials, _token = _register_and_login(client)
    with app.app_context():
        expired_token = create_access_token(identity=credentials.username, expires_delta=timedelta(seconds=-1))

    me_response = client.get("/auth/me", headers=_auth_headers(expired_token))

    assert me_response.status_code == 401
    assert me_response.get_json()["error"] == "token expired"


def test_owner_create_and_list_poll_integration(client):
    _credentials, token = _register_and_login(client)
    poll_payload = PollPayloadDouble.valid()

    create_response = client.post("/polls", json=poll_payload, headers=_auth_headers(token))
    assert create_response.status_code == 201
    created_poll = create_response.get_json()

    list_response = client.get("/polls/mine", headers=_auth_headers(token))
    assert list_response.status_code == 200
    my_polls = list_response.get_json()

    assert any(poll["id"] == created_poll["id"] for poll in my_polls)
    assert created_poll["isClosed"] is False


def test_create_poll_accepts_iso_dates_integration(client):
    _credentials, token = _register_and_login(client)
    poll_payload = PollPayloadDouble.valid()
    poll_payload["dates"] = ["2026-06-01", "2026-06-02", "2026-06-03"]

    create_response = client.post("/polls", json=poll_payload, headers=_auth_headers(token))

    assert create_response.status_code == 201
    payload = create_response.get_json()
    assert payload["dates"] == ["2026-06-01", "2026-06-02", "2026-06-03"]


def test_create_poll_rejects_non_iso_dates_integration(client):
    _credentials, token = _register_and_login(client)
    poll_payload = PollPayloadDouble.valid()
    poll_payload["dates"] = ["06/01/2026", "2026-06-02", "2026-06-03"]

    create_response = client.post("/polls", json=poll_payload, headers=_auth_headers(token))

    assert create_response.status_code == 400
    payload = create_response.get_json()
    assert payload["error"] == "dates must use ISO format YYYY-MM-DD"


def test_public_vote_and_close_poll_integration(client):
    _credentials, token = _register_and_login(client)
    poll_payload = PollPayloadDouble.valid()

    create_response = client.post("/polls", json=poll_payload, headers=_auth_headers(token))
    created_poll = create_response.get_json()
    token_public = created_poll["token"]
    dates = created_poll["dates"]

    vote_payload = VotePayloadDouble.for_dates(voter_name="itest_voter_anna", dates=dates, value="yes")
    vote_response = client.post(f"/public/polls/{token_public}/vote", json=vote_payload)
    assert vote_response.status_code == 200

    public_poll_response = client.get(f"/public/polls/{token_public}")
    assert public_poll_response.status_code == 200
    public_payload = public_poll_response.get_json()
    assert any(v["name"] == "itest_voter_anna" for v in public_payload["votes"])

    close_response = client.post(f"/polls/{created_poll['id']}/close", headers=_auth_headers(token))
    assert close_response.status_code == 200

    public_after_close_response = client.get(f"/public/polls/{token_public}")
    assert public_after_close_response.status_code == 404
