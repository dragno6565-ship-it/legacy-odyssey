"""Read current Play store listing + production track release notes."""
import json
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SA_PATH = "C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json"
PACKAGE = "com.legacyodyssey.app"
LANGUAGE = "en-US"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]
BASE = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE}"

creds = service_account.Credentials.from_service_account_file(SA_PATH, scopes=SCOPES)
creds.refresh(Request())
headers = {"Authorization": f"Bearer {creds.token}"}

edit_id = requests.post(f"{BASE}/edits", headers=headers, timeout=30).json()["id"]

listing = requests.get(f"{BASE}/edits/{edit_id}/listings/{LANGUAGE}", headers=headers, timeout=30).json()
print("=" * 60)
print("STORE LISTING (en-US)")
print("=" * 60)
print(f"Title:       {listing.get('title','')}")
print(f"Short:       {listing.get('shortDescription','')}")
print(f"Full chars:  {len(listing.get('fullDescription',''))}")
print(f"--- full description ---")
print(listing.get("fullDescription", ""))
print("=" * 60)
print()

track = requests.get(f"{BASE}/edits/{edit_id}/tracks/production", headers=headers, timeout=30).json()
print("PRODUCTION TRACK")
print("=" * 60)
for r in track.get("releases", []):
    print(f"name={r.get('name')!r}  status={r.get('status')!r}  versionCodes={r.get('versionCodes')}")
    for n in r.get("releaseNotes", []):
        print(f"  [{n.get('language')}] {n.get('text','')}")
    print()

# Don't commit edit (read-only)
print("(read-only — edit dropped)")
