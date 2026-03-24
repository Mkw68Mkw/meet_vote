from __future__ import annotations

import os

import pytest

os.environ.setdefault("JWT_SECRET_KEY", "integration-tests-secret-key-1234567890")

from main import Poll, User, Vote, app, db  # noqa: E402


def _purge_test_data() -> None:
    test_users = User.query.filter(User.username.like("itest_user_%")).all()
    for user in test_users:
        for poll in Poll.query.filter_by(owner_id=user.id).all():
            db.session.delete(poll)
        db.session.delete(user)

    test_polls = Poll.query.filter(Poll.title.like("ITest Poll%")).all()
    for poll in test_polls:
        db.session.delete(poll)

    stray_votes = Vote.query.filter(Vote.voter_name.like("itest_voter_%")).all()
    for vote in stray_votes:
        db.session.delete(vote)

    db.session.commit()


@pytest.fixture()
def client():
    app.config.update(TESTING=True)
    with app.app_context():
        _purge_test_data()
        with app.test_client() as test_client:
            yield test_client
        _purge_test_data()
