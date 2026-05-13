"""Read current Play production track release status."""
import json, sys, requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SA_PATH = "C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json"
PACKAGE = "com.legacyodyssey.app"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]
BASE = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE}"

creds = service_account.Credentials.from_service_account_file(SA_PATH, scopes=SCOPES)
creds.refresh(Request())
h = {"Authorization": f"Bearer {creds.token}"}
edit_id = requests.post(f"{BASE}/edits", headers=h, timeout=30).json()["id"]
track = requests.get(f"{BASE}/edits/{edit_id}/tracks/production", headers=h, timeout=30).json()
print("Android — Google Play (production track)")
for r in track.get("releases", []):
    print(f"  name        : {r.get('name')}")
    print(f"  versionCodes: {r.get('versionCodes')}")
    print(f"  status      : {r.get('status')}")
    rollout = r.get('userFraction')
    if rollout is not None:
        print(f"  rollout     : {rollout*100:.0f}%")
    for n in r.get("releaseNotes", []):
        print(f"  notes ({n.get('language')}): {(n.get('text','') or '')[:140]}...")
