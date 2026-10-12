document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const clubsList = document.getElementById("clubs-list");
  const clubForm = document.getElementById("club-form");
  const clubMessageDiv = document.getElementById("club-message");

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function fetchClubs() {
    try {
      const response = await fetch("/clubs");
      const clubs = await response.json();

      clubsList.innerHTML = "";
      Object.entries(clubs).forEach(([name, details]) => {
        const requestsHTML =
          details.pending_requests && details.pending_requests.length > 0
            ? details.pending_requests
                .map(
                  (email) => `
                    <div class="club-request-row">
                      <span>${email}</span>
                      <div class="club-request-actions">
                        <input type="password" class="admin-password" placeholder="Admin password" />
                        <button class="approve-club-btn" data-club="${name}" data-email="${email}">Approve</button>
                        <button class="reject-club-btn" data-club="${name}" data-email="${email}">Reject</button>
                      </div>
                    </div>`
                )
                .join("")
            : "<p><em>No pending requests</em></p>";

        const clubCard = document.createElement("div");
        clubCard.className = "club-card";
        clubCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Category:</strong> ${details.category}</p>
          <p><strong>Location:</strong> ${details.location}</p>
          <p><strong>Members:</strong> ${details.members.length}</p>
          <div class="club-members">
            <strong>Members:</strong>
            <ul>
              ${details.members.map((email) => `<li>${email}</li>`).join("") || "<li>No members yet</li>"}
            </ul>
          </div>
          <div class="club-request-list">
            <strong>Pending Requests:</strong>
            ${requestsHTML}
          </div>
          <button class="join-club-btn" data-club="${name}">Request to join</button>
        `;
        clubsList.appendChild(clubCard);
      });

      document.querySelectorAll(".join-club-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const clubName = button.getAttribute("data-club");
          const studentEmail = window.prompt("Enter student email to join this club:");
          if (!studentEmail) return;

          const response = await fetch(
            `/clubs/${encodeURIComponent(clubName)}/join?student_email=${encodeURIComponent(studentEmail)}`,
            { method: "POST" }
          );
          const result = await response.json();

          if (response.ok) {
            clubMessageDiv.textContent = `${studentEmail} requested membership for ${clubName}.`;
            clubMessageDiv.className = "success";
          } else {
            clubMessageDiv.textContent = result.detail || "Request failed.";
            clubMessageDiv.className = "error";
          }
          clubMessageDiv.classList.remove("hidden");
          setTimeout(() => clubMessageDiv.classList.add("hidden"), 5000);
          fetchClubs();
        });
      });

      document.querySelectorAll(".approve-club-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const clubName = button.getAttribute("data-club");
          const email = button.getAttribute("data-email");
          const passwordInput = button.closest(".club-request-row").querySelector(".admin-password");
          const adminPassword = passwordInput.value;

          const response = await fetch(
            `/clubs/${encodeURIComponent(clubName)}/requests/approve?student_email=${encodeURIComponent(email)}&admin_password=${encodeURIComponent(adminPassword)}`,
            { method: "POST" }
          );
          const result = await response.json();

          if (response.ok) {
            clubMessageDiv.textContent = `Approved ${email} for ${clubName}.`;
            clubMessageDiv.className = "success";
          } else {
            clubMessageDiv.textContent = result.detail || "Approval failed.";
            clubMessageDiv.className = "error";
          }
          clubMessageDiv.classList.remove("hidden");
          setTimeout(() => clubMessageDiv.classList.add("hidden"), 5000);
          fetchClubs();
        });
      });

      document.querySelectorAll(".reject-club-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const clubName = button.getAttribute("data-club");
          const email = button.getAttribute("data-email");
          const passwordInput = button.closest(".club-request-row").querySelector(".admin-password");
          const adminPassword = passwordInput.value;

          const response = await fetch(
            `/clubs/${encodeURIComponent(clubName)}/requests/reject?student_email=${encodeURIComponent(email)}&admin_password=${encodeURIComponent(adminPassword)}`,
            { method: "POST" }
          );
          const result = await response.json();

          if (response.ok) {
            clubMessageDiv.textContent = `Rejected ${email} for ${clubName}.`;
            clubMessageDiv.className = "success";
          } else {
            clubMessageDiv.textContent = result.detail || "Rejection failed.";
            clubMessageDiv.className = "error";
          }
          clubMessageDiv.classList.remove("hidden");
          setTimeout(() => clubMessageDiv.classList.add("hidden"), 5000);
          fetchClubs();
        });
      });
    } catch (error) {
      clubsList.innerHTML = "<p>Failed to load clubs. Please try again later.</p>";
      console.error("Error fetching clubs:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  clubForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById("club-name").value,
      description: document.getElementById("club-description").value,
      category: document.getElementById("club-category").value,
      location: document.getElementById("club-location").value,
    };

    try {
      const response = await fetch("/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        clubMessageDiv.textContent = `Created club ${result.name}.`;
        clubMessageDiv.className = "success";
        clubForm.reset();
      } else {
        clubMessageDiv.textContent = result.detail || "Unable to create club.";
        clubMessageDiv.className = "error";
      }

      clubMessageDiv.classList.remove("hidden");
      setTimeout(() => clubMessageDiv.classList.add("hidden"), 5000);
      fetchClubs();
    } catch (error) {
      clubMessageDiv.textContent = "Failed to create club. Please try again.";
      clubMessageDiv.className = "error";
      clubMessageDiv.classList.remove("hidden");
      console.error("Error creating club:", error);
    }
  });

  fetchActivities();
  fetchClubs();
});
