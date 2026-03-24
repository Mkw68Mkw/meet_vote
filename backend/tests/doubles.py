from __future__ import annotations

import time
from dataclasses import dataclass


@dataclass(frozen=True)
class UserCredentialsDouble:
    username: str
    password: str

    @classmethod
    def unique(cls, prefix: str = "itest_user") -> "UserCredentialsDouble":
        ts = int(time.time() * 1000)
        return cls(username=f"{prefix}_{ts}", password="StrongPassword123!")

    def as_payload(self) -> dict[str, str]:
        return {"username": self.username, "password": self.password}


class PollPayloadDouble:
    @staticmethod
    def valid(title_prefix: str = "ITest Poll") -> dict[str, object]:
        ts = int(time.time() * 1000)
        return {
            "title": f"{title_prefix} {ts}",
            "description": "Created by integration test",
            "dates": ["2026-05-01", "2026-05-02", "2026-05-03"],
        }


class VotePayloadDouble:
    @staticmethod
    def for_dates(voter_name: str, dates: list[str], value: str = "yes") -> dict[str, object]:
        return {
            "name": voter_name,
            "selections": [{"date": d, "value": value} for d in dates],
        }
