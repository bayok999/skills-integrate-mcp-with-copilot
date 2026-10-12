from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_create_club_and_approve_membership():
    club_payload = {
        "name": "Solar Robotics Club",
        "description": "Build robots and compete in local challenges.",
        "category": "STEM",
        "location": "Room 204",
    }

    create_response = client.post("/clubs", json=club_payload)
    assert create_response.status_code == 200, create_response.text
    created = create_response.json()
    assert created["name"] == "Solar Robotics Club"
    assert created["members"] == []

    join_response = client.post(
        "/clubs/Solar Robotics Club/join",
        params={"student_email": "alice@mergington.edu"},
    )
    assert join_response.status_code == 200, join_response.text
    assert join_response.json()["status"] == "pending"

    approval_response = client.post(
        "/clubs/Solar Robotics Club/requests/approve",
        params={
            "student_email": "alice@mergington.edu",
            "admin_password": "admin123",
        },
    )
    assert approval_response.status_code == 200, approval_response.text
    assert approval_response.json()["status"] == "approved"

    club_response = client.get("/clubs/Solar Robotics Club")
    assert club_response.status_code == 200, club_response.text
    club = club_response.json()
    assert "alice@mergington.edu" in club["members"]


def test_create_club_rejects_missing_name():
    response = client.post("/clubs", json={"description": "Missing name"})
    assert response.status_code == 400
