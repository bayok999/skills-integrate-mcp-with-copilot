"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"]
    }
}

clubs = {
    "Robotics Club": {
        "name": "Robotics Club",
        "description": "Build robots and compete in local challenges.",
        "category": "STEM",
        "location": "Room 204",
        "members": ["teacher@mergington.edu"],
        "pending_requests": ["alex@mergington.edu"],
        "created_by": "teacher@mergington.edu"
    },
    "Drama Club": {
        "name": "Drama Club",
        "description": "Create performances and learn stagecraft.",
        "category": "Arts",
        "location": "Auditorium",
        "members": ["teacher@mergington.edu"],
        "pending_requests": [],
        "created_by": "teacher@mergington.edu"
    }
}

ADMIN_PASSWORD = "admin123"


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}


@app.get("/clubs")
def get_clubs():
    return clubs


@app.get("/clubs/{club_name}")
def get_club(club_name: str):
    club = clubs.get(club_name)
    if club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    return club


@app.post("/clubs")
def create_club(club_data: dict):
    name = str(club_data.get("name", "")).strip()
    if not name:
        raise HTTPException(status_code=400, detail="Club name is required")

    if name in clubs:
        raise HTTPException(status_code=400, detail="Club already exists")

    club = {
        "name": name,
        "description": str(club_data.get("description", "")).strip(),
        "category": str(club_data.get("category", "General")).strip() or "General",
        "location": str(club_data.get("location", "TBD")).strip() or "TBD",
        "members": [],
        "pending_requests": [],
        "created_by": "admin@mergington.edu"
    }
    clubs[name] = club
    return club


@app.post("/clubs/{club_name}/join")
def request_join_club(club_name: str, student_email: str):
    club = clubs.get(club_name)
    if club is None:
        raise HTTPException(status_code=404, detail="Club not found")

    student_email = student_email.strip()
    if not student_email:
        raise HTTPException(status_code=400, detail="Student email is required")

    if student_email in club["members"]:
        raise HTTPException(status_code=400, detail="Student is already a member")

    if student_email in club["pending_requests"]:
        raise HTTPException(status_code=400, detail="Membership request is already pending")

    club["pending_requests"].append(student_email)
    return {
        "status": "pending",
        "club": club_name,
        "student_email": student_email,
        "pending_requests": club["pending_requests"]
    }


@app.post("/clubs/{club_name}/requests/approve")
def approve_club_request(club_name: str, student_email: str, admin_password: str):
    club = clubs.get(club_name)
    if club is None:
        raise HTTPException(status_code=404, detail="Club not found")

    if admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    student_email = student_email.strip()
    if student_email not in club["pending_requests"]:
        raise HTTPException(status_code=404, detail="Request not found")

    club["pending_requests"].remove(student_email)
    if student_email not in club["members"]:
        club["members"].append(student_email)

    return {
        "status": "approved",
        "club": club_name,
        "student_email": student_email,
        "members": club["members"]
    }


@app.post("/clubs/{club_name}/requests/reject")
def reject_club_request(club_name: str, student_email: str, admin_password: str):
    club = clubs.get(club_name)
    if club is None:
        raise HTTPException(status_code=404, detail="Club not found")

    if admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    student_email = student_email.strip()
    if student_email not in club["pending_requests"]:
        raise HTTPException(status_code=404, detail="Request not found")

    club["pending_requests"].remove(student_email)
    return {
        "status": "rejected",
        "club": club_name,
        "student_email": student_email,
        "pending_requests": club["pending_requests"]
    }
