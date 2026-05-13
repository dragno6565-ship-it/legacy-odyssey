"""
Inspect (and optionally set) the v1.0.7 release notes on the production
track of Legacy Odyssey on Google Play.

`eas submit` already created and committed an edit that pushed the v1.0.7
AAB (versionCode 17) to the production track and sent it for review. The
release notes that landed on that release are whatever eas-cli sent — we
want to overwrite them with the v1.0.7 copy from STORE_LISTING_v1.0.7.md.

Strategy:
1. Open a fresh edit
2. Read the current production track to find the in-progress release for
   versionCode 17
3. PATCH the release with the desired releaseNotes (en-US)
4. Commit (this is a metadata-only edit, no review required for notes)

If anything looks off, run with `--dry-run` first.

Run:
    python scripts/update-play-release-notes.py
    python scripts/update-play-release-notes.py --dry-run
"""
import json
import sys
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SA_PATH = "C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json"
PACKAGE = "com.legacyodyssey.app"
LANGUAGE = "en-US"
TRACK = "production"
TARGET_VERSION_CODE = 19
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]
BASE = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE}"

RELEASE_NOTES = (
    "This update refines the Legacy Odyssey experience with elegant Lucide "
    "line-art icons throughout the app — replacing emoji with consistent, "
    "beautifully designed icons in the brand gold.\n\n"
    "Sign-up has moved to legacyodyssey.com so you can claim your child's "
    ".com domain in 2 minutes. Existing accounts continue to sign in normally.\n\n"
    "Performance improvements and bug fixes."
)


def get_token():
    creds = service_account.Credentials.from_service_account_file(SA_PATH, scopes=SCOPES)
    creds.refresh(Request())
    return creds.token


def main():
    dry = "--dry-run" in sys.argv
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Open an edit
    r = requests.post(f"{BASE}/edits", headers=headers, timeout=30)
    if r.status_code != 200:
        print(f"FAILED to open edit: {r.status_code} {r.text}")
        sys.exit(1)
    edit_id = r.json()["id"]
    print(f"  opened edit: {edit_id}")

    # 2. Read the production track
    r = requests.get(
        f"{BASE}/edits/{edit_id}/tracks/{TRACK}",
        headers=headers, timeout=30,
    )
    if r.status_code != 200:
        print(f"FAILED to read track: {r.status_code} {r.text}")
        sys.exit(1)
    track = r.json()
    print(f"  current production track:")
    print(json.dumps(track, indent=2))

    releases = track.get("releases", [])
    target = None
    for rel in releases:
        codes = rel.get("versionCodes") or []
        if str(TARGET_VERSION_CODE) in [str(c) for c in codes]:
            target = rel
            break

    if not target:
        print(f"FAILED: no release found containing versionCode {TARGET_VERSION_CODE}")
        sys.exit(1)

    print(f"\n  found release: name={target.get('name')!r} status={target.get('status')!r}")
    existing_notes = target.get("releaseNotes", [])
    for n in existing_notes:
        print(f"    [{n.get('language')}] {n.get('text','')[:120]!r}")

    if dry:
        print("\n  --dry-run: stopping before patch")
        return

    # 3. Patch — replace releaseNotes for en-US, keep everything else
    target["releaseNotes"] = [
        {"language": LANGUAGE, "text": RELEASE_NOTES}
    ]
    new_track_body = {
        "track": TRACK,
        "releases": [target],
    }
    r = requests.put(
        f"{BASE}/edits/{edit_id}/tracks/{TRACK}",
        headers=headers, data=json.dumps(new_track_body), timeout=30,
    )
    if r.status_code != 200:
        print(f"FAILED to patch track: {r.status_code} {r.text}")
        sys.exit(1)
    print(f"\n  patched release notes OK")
    print(f"  new release notes ({LANGUAGE}): {RELEASE_NOTES[:120]!r}")

    # 4. Commit
    r = requests.post(f"{BASE}/edits/{edit_id}:commit", headers=headers, timeout=30)
    if r.status_code != 200:
        print(f"FAILED to commit: {r.status_code} {r.text}")
        sys.exit(1)
    print(f"  committed edit {edit_id}")
    print()
    print("DONE. Release notes for v1.0.7 (versionCode 17) updated on Production track.")


if __name__ == "__main__":
    main()
