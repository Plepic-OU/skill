#!/usr/bin/env bash
set -euo pipefail

# Demo user credentials — disposable accounts in ephemeral emulator, not secrets.
AUTH_EMULATOR="http://127.0.0.1:9099"
FIRESTORE_EMULATOR="http://127.0.0.1:9199"
PROJECT_ID="skill-plepic-com"

# --- Create demo users ---
# Use signUp endpoint (no fixed UIDs — emulator doesn't support localId).
# Capture returned localId for Firestore seeding.

create_user() {
  local email="$1" password="$2" display_name="$3"
  local attempt response http_code body uid

  for attempt in 1 2 3 4 5; do
    response=$(curl -s -w "\n%{http_code}" \
      "${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"${email}\",\"password\":\"${password}\",\"displayName\":\"${display_name}\",\"returnSecureToken\":true}" \
      2>&1) || true
    http_code=$(echo "$response" | tail -1)
    if [ "$http_code" = "200" ]; then
      uid=$(echo "$response" | sed '$d' | grep -o '"localId":"[^"]*"' | cut -d'"' -f4)
      echo "  Created user: ${email} (${uid})" >&2
      echo "$uid"
      return 0
    fi
    body=$(echo "$response" | sed '$d' | tr -d '\n')
    echo "  Attempt $attempt for ${email} failed (HTTP $http_code): ${body}" >&2
    sleep 2
  done

  echo "  ERROR: Failed to create user ${email} after 5 attempts" >&2
  return 1
}

echo "Creating demo users..."
ALICE_UID=$(create_user "demo-alice@plepic.com" "demo-alice-123" "Alice")
BOB_UID=$(create_user "demo-bob@plepic.com" "demo-bob-123" "Bob")

# --- Seed Alice's Firestore data ---

seed_user_data() {
  local uid="$1" display_name="$2" safety_zone="$3" autonomy="$4" parallel="$5" skill_usage="$6"

  curl -sf "${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}" \
    -X PATCH \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer owner' \
    -d "{
      \"fields\": {
        \"displayName\": {\"stringValue\": \"${display_name}\"},
        \"avatarUrl\": {\"stringValue\": \"\"},
        \"updatedAt\": {\"timestampValue\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
        \"safetyZone\": {\"stringValue\": \"${safety_zone}\"},
        \"skills\": {
          \"mapValue\": {
            \"fields\": {
              \"autonomy\": {\"integerValue\": \"${autonomy}\"},
              \"parallelExecution\": {\"integerValue\": \"${parallel}\"},
              \"skillUsage\": {\"integerValue\": \"${skill_usage}\"}
            }
          }
        }
      }
    }" > /dev/null

  echo "  Seeded data for: ${display_name} (${uid})"
}

echo "Seeding Firestore data..."
seed_user_data "$ALICE_UID" "Alice" "normal" 4 3 5

echo "Demo data seeding complete."
echo "  Alice UID: ${ALICE_UID}"
echo "  Bob UID: ${BOB_UID}"
