from __future__ import annotations

import os
import secrets
from datetime import datetime, timezone

import bcrypt
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "meet_vote.db")

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)  # Stores bcrypt hash
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)

    polls = db.relationship("Poll", backref="owner", lazy=True, cascade="all, delete-orphan")


class Poll(db.Model):
    __tablename__ = "polls"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    public_token = db.Column(db.String(32), unique=True, nullable=False, index=True)
    is_closed = db.Column(db.Boolean, nullable=False, default=False)
    closed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)

    dates = db.relationship("PollDate", backref="poll", lazy=True, cascade="all, delete-orphan")
    votes = db.relationship("Vote", backref="poll", lazy=True, cascade="all, delete-orphan")


class PollDate(db.Model):
    __tablename__ = "poll_dates"

    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey("polls.id"), nullable=False, index=True)
    date = db.Column(db.String(32), nullable=False)


class Vote(db.Model):
    __tablename__ = "votes"

    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey("polls.id"), nullable=False, index=True)
    voter_name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)

    selections = db.relationship("VoteSelection", backref="vote", lazy=True, cascade="all, delete-orphan")

    __table_args__ = (db.UniqueConstraint("poll_id", "voter_name", name="uq_vote_poll_voter"),)


class VoteSelection(db.Model):
    __tablename__ = "vote_selections"

    id = db.Column(db.Integer, primary_key=True)
    vote_id = db.Column(db.Integer, db.ForeignKey("votes.id"), nullable=False, index=True)
    date = db.Column(db.String(32), nullable=False)
    value = db.Column(db.String(16), nullable=False)  # yes | no | maybe


def is_bcrypt_hash(password_value: str) -> bool:
    return password_value.startswith("$2a$") or password_value.startswith("$2b$") or password_value.startswith("$2y$")


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, stored_password: str) -> bool:
    if is_bcrypt_hash(stored_password):
        return bcrypt.checkpw(plain_password.encode("utf-8"), stored_password.encode("utf-8"))
    # Backward-compatible fallback for already existing plaintext users.
    return plain_password == stored_password


def serialize_poll_public(poll: Poll) -> dict:
    votes_payload = []
    for vote in poll.votes:
        votes_payload.append(
            {
                "name": vote.voter_name,
                "selections": [{"date": s.date, "value": s.value} for s in vote.selections],
            }
        )

    return {
        "id": poll.id,
        "token": poll.public_token,
        "title": poll.title,
        "description": poll.description,
        "dates": [d.date for d in poll.dates],
        "votes": votes_payload,
        "isClosed": poll.is_closed,
        "closedAt": poll.closed_at.isoformat() if poll.closed_at else None,
        "createdAt": poll.created_at.isoformat(),
    }


def serialize_poll_owner(poll: Poll) -> dict:
    return {
        "id": poll.id,
        "token": poll.public_token,
        "title": poll.title,
        "description": poll.description,
        "dates": [d.date for d in poll.dates],
        "voteCount": len(poll.votes),
        "isClosed": poll.is_closed,
        "closedAt": poll.closed_at.isoformat() if poll.closed_at else None,
        "createdAt": poll.created_at.isoformat(),
    }


def parse_poll_payload(payload: dict) -> tuple[str, str | None, list[str], str | None]:
    title = (payload.get("title") or "").strip()
    description = payload.get("description")
    if description is not None:
        description = description.strip() or None

    dates = payload.get("dates") or []
    if not isinstance(dates, list):
        return "", None, [], "dates must be an array"
    normalized_dates = sorted({str(d).strip() for d in dates if str(d).strip()})

    if not title:
        return "", None, [], "title is required"
    if len(normalized_dates) < 3:
        return "", None, [], "at least 3 dates are required"

    return title, description, normalized_dates, None


def seed_sample_data() -> None:
    # Seed only once to avoid duplicate sample data across restarts.
    if User.query.filter_by(username="demo").first():
        return

    demo_user = User(username="demo", password=hash_password("demo123"))
    db.session.add(demo_user)
    db.session.flush()

    demo_poll = Poll(
        owner_id=demo_user.id,
        title="Team Meeting Februar",
        description="Bitte tragt ein, wann ihr Zeit habt.",
        public_token="sample-poll-token",
    )
    db.session.add(demo_poll)
    db.session.flush()

    sample_dates = ["2026-03-02", "2026-03-03", "2026-03-05", "2026-03-06"]
    for date_value in sample_dates:
        db.session.add(PollDate(poll_id=demo_poll.id, date=date_value))

    anna_vote = Vote(poll_id=demo_poll.id, voter_name="Anna")
    db.session.add(anna_vote)
    db.session.flush()
    db.session.add_all(
        [
            VoteSelection(vote_id=anna_vote.id, date="2026-03-02", value="yes"),
            VoteSelection(vote_id=anna_vote.id, date="2026-03-03", value="maybe"),
            VoteSelection(vote_id=anna_vote.id, date="2026-03-05", value="no"),
            VoteSelection(vote_id=anna_vote.id, date="2026-03-06", value="yes"),
        ]
    )

    ben_vote = Vote(poll_id=demo_poll.id, voter_name="Ben")
    db.session.add(ben_vote)
    db.session.flush()
    db.session.add_all(
        [
            VoteSelection(vote_id=ben_vote.id, date="2026-03-02", value="maybe"),
            VoteSelection(vote_id=ben_vote.id, date="2026-03-03", value="yes"),
            VoteSelection(vote_id=ben_vote.id, date="2026-03-05", value="yes"),
            VoteSelection(vote_id=ben_vote.id, date="2026-03-06", value="no"),
        ]
    )

    db.session.commit()


def ensure_runtime_schema_updates() -> None:
    # create_all does not add new columns on existing SQLite tables.
    poll_columns_result = db.session.execute(text("PRAGMA table_info(polls)")).fetchall()
    poll_columns = {row[1] for row in poll_columns_result}

    if "is_closed" not in poll_columns:
        db.session.execute(text("ALTER TABLE polls ADD COLUMN is_closed BOOLEAN NOT NULL DEFAULT 0"))
    if "closed_at" not in poll_columns:
        db.session.execute(text("ALTER TABLE polls ADD COLUMN closed_at DATETIME"))
    db.session.commit()


@app.get("/health")
def health() -> tuple[dict, int]:
    return {"ok": True}, 200


@app.post("/auth/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip().lower()
    password = (payload.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "username already exists"}), 409

    user = User(username=username, password=hash_password(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({"id": user.id, "username": user.username}), 201


@app.post("/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip().lower()
    password = (payload.get("password") or "").strip()

    user = User.query.filter_by(username=username).first()
    if not user or not verify_password(password, user.password):
        return jsonify({"error": "invalid credentials"}), 401

    if not is_bcrypt_hash(user.password):
        # Transparent migration for older plaintext rows.
        user.password = hash_password(password)
        db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": {"id": user.id, "username": user.username}}), 200


@app.get("/auth/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"id": user.id, "username": user.username}), 200


@app.post("/polls")
@jwt_required()
def create_poll():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}

    title, description, dates, error = parse_poll_payload(payload)
    if error:
        return jsonify({"error": error}), 400

    poll = Poll(
        owner_id=user_id,
        title=title,
        description=description,
        public_token=secrets.token_urlsafe(12),
    )
    db.session.add(poll)
    db.session.flush()

    for date_value in dates:
        db.session.add(PollDate(poll_id=poll.id, date=date_value))

    db.session.commit()
    return jsonify(serialize_poll_owner(poll)), 201


@app.get("/polls/mine")
@jwt_required()
def list_my_polls():
    user_id = int(get_jwt_identity())
    polls = Poll.query.filter_by(owner_id=user_id).order_by(Poll.created_at.desc()).all()
    return jsonify([serialize_poll_owner(poll) for poll in polls]), 200


@app.get("/polls/<int:poll_id>")
@jwt_required()
def get_my_poll(poll_id: int):
    user_id = int(get_jwt_identity())
    poll = Poll.query.filter_by(id=poll_id, owner_id=user_id).first()
    if not poll:
        return jsonify({"error": "poll not found"}), 404
    return jsonify(serialize_poll_public(poll)), 200


@app.put("/polls/<int:poll_id>")
@jwt_required()
def update_my_poll(poll_id: int):
    user_id = int(get_jwt_identity())
    poll = Poll.query.filter_by(id=poll_id, owner_id=user_id).first()
    if not poll:
        return jsonify({"error": "poll not found"}), 404

    payload = request.get_json(silent=True) or {}
    title, description, dates, error = parse_poll_payload(payload)
    if error:
        return jsonify({"error": error}), 400

    poll.title = title
    poll.description = description

    PollDate.query.filter_by(poll_id=poll.id).delete()
    for date_value in dates:
        db.session.add(PollDate(poll_id=poll.id, date=date_value))

    db.session.commit()
    return jsonify(serialize_poll_owner(poll)), 200


@app.delete("/polls/<int:poll_id>")
@jwt_required()
def delete_my_poll(poll_id: int):
    user_id = int(get_jwt_identity())
    poll = Poll.query.filter_by(id=poll_id, owner_id=user_id).first()
    if not poll:
        return jsonify({"error": "poll not found"}), 404

    db.session.delete(poll)
    db.session.commit()
    return jsonify({"deleted": True}), 200


@app.post("/polls/<int:poll_id>/close")
@jwt_required()
def close_my_poll(poll_id: int):
    user_id = int(get_jwt_identity())
    poll = Poll.query.filter_by(id=poll_id, owner_id=user_id).first()
    if not poll:
        return jsonify({"error": "poll not found"}), 404
    if poll.is_closed:
        return jsonify({"error": "poll already closed"}), 400

    poll.is_closed = True
    poll.closed_at = utc_now()
    db.session.commit()
    return jsonify(serialize_poll_owner(poll)), 200


@app.get("/public/polls/<string:token>")
def get_public_poll(token: str):
    poll = Poll.query.filter_by(public_token=token).first()
    if not poll or poll.is_closed:
        return jsonify({"error": "poll not found"}), 404
    return jsonify(serialize_poll_public(poll)), 200


@app.post("/public/polls/<string:token>/vote")
def upsert_vote(token: str):
    poll = Poll.query.filter_by(public_token=token).first()
    if not poll or poll.is_closed:
        return jsonify({"error": "poll not found"}), 404

    payload = request.get_json(silent=True) or {}
    voter_name = (payload.get("name") or "").strip()
    selections = payload.get("selections") or []

    if not voter_name:
        return jsonify({"error": "name is required"}), 400
    if not isinstance(selections, list) or len(selections) == 0:
        return jsonify({"error": "selections must be a non-empty array"}), 400

    allowed_dates = {d.date for d in poll.dates}
    normalized = []
    for item in selections:
        date_value = str(item.get("date", "")).strip()
        vote_value = str(item.get("value", "")).strip().lower()
        if date_value not in allowed_dates:
            return jsonify({"error": f"invalid date '{date_value}'"}), 400
        if vote_value not in {"yes", "no", "maybe"}:
            return jsonify({"error": f"invalid vote value '{vote_value}'"}), 400
        normalized.append((date_value, vote_value))

    vote = Vote.query.filter_by(poll_id=poll.id, voter_name=voter_name).first()
    if not vote:
        vote = Vote(poll_id=poll.id, voter_name=voter_name)
        db.session.add(vote)
        db.session.flush()
    else:
        vote.updated_at = utc_now()
        VoteSelection.query.filter_by(vote_id=vote.id).delete()

    for date_value, vote_value in normalized:
        db.session.add(VoteSelection(vote_id=vote.id, date=date_value, value=vote_value))

    db.session.commit()
    return jsonify({"ok": True, "poll": serialize_poll_public(poll)}), 200


with app.app_context():
    db.create_all()
    ensure_runtime_schema_updates()
    seed_sample_data()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
