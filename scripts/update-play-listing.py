"""
Update Google Play store listing copy via the Android Publisher API.

Auth: service account at C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json
Package: com.legacyodyssey.app

Edits the en-US listing:
  short description (80 chars max)
  full description (4000 chars max)

Does NOT touch the production track or roll out a release. This is a
"draft" change to the store listing only — Dan still publishes when ready.

Run: python scripts/update-play-listing.py
"""
import json
import sys
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SA_PATH = "C:/Users/dragn/Downloads/warm-practice-349716-6414eeb91dbe.json"
PACKAGE = "com.legacyodyssey.app"
LANGUAGE = "en-US"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]
BASE = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE}"

SHORT_DESCRIPTION = "Your baby's own .com. A private, beautiful baby book on their own website."

FULL_DESCRIPTION = """Your baby deserves their own corner of the internet.

Legacy Odyssey gives every child a real .com domain — like your-childs-name.com — a private, beautifully designed baby book that lives on their own website for as long as you choose.

Not a social media post. Not a camera roll. A permanent piece of the internet dedicated entirely to your child's story.

YOUR BABY'S OWN .COM
Every family gets a real .com domain, automatically purchased and configured the moment you sign up. It belongs to your family. Nobody else can ever claim it.

BABY BOOKS & FAMILY ALBUMS
Document your baby's first year chapter by chapter — or build a family album that spans generations. Both products are beautifully designed and ready to fill in from your phone.

WHAT'S INSIDE YOUR BOOK
✦ Birth story, coming home, and monthly milestones (months 1–12)
✦ Growth tracking — weight, length, and every first
✦ The Time Vault — letters written today, sealed until their 18th birthday
✦ Family member profiles with photos and stories
✦ Family recipes passed down through generations
✦ Before You Arrived — pregnancy journey and nursery memories

SHARE WITH EVERYONE YOU LOVE
Give grandparents, aunts, uncles, and friends your book's web address and shared password. They can watch your child grow from anywhere in the world — no account needed to view.

COMPLETELY PRIVATE
Password-protected. No ads. No algorithm. No public profile. Your family's memories are visible only to the people you choose. Unlike Instagram or Facebook, no platform change can hide your content or shut it down.

EASY TO USE
Fill in sections whenever you have a spare moment. Add photos directly from your phone. Changes appear on the website instantly. No technical skills needed.

PLANS
✦ $29 your first year — introductory offer
✦ Then $49.99/year — cancel anytime
✦ Or $4.99/month + one-time $5.99 setup fee
✦ Everything included: .com domain, hosting, unlimited photos, app access

Check if your baby's name is still available at legacyodyssey.com"""


def get_token():
    creds = service_account.Credentials.from_service_account_file(SA_PATH, scopes=SCOPES)
    creds.refresh(Request())
    return creds.token


def main():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 1. Open an edit
    r = requests.post(f"{BASE}/edits", headers=headers, timeout=30)
    if r.status_code != 200:
        print(f"FAILED to open edit: {r.status_code} {r.text}")
        sys.exit(1)
    edit_id = r.json()["id"]
    print(f"  opened edit: {edit_id}")

    # 2. Read existing listing (so we can show what's changing)
    r = requests.get(
        f"{BASE}/edits/{edit_id}/listings/{LANGUAGE}",
        headers=headers, timeout=30,
    )
    if r.status_code == 200:
        existing = r.json()
        print(f"  current short:  {existing.get('shortDescription', '')[:80]!r}")
        print(f"  current full chars: {len(existing.get('fullDescription',''))}")
    else:
        print(f"  no existing en-US listing yet ({r.status_code})")

    # 3. Patch the listing
    body = {
        "language": LANGUAGE,
        "shortDescription": SHORT_DESCRIPTION,
        "fullDescription": FULL_DESCRIPTION,
        # Title intentionally omitted — keep "Legacy Odyssey" as set
        # Video / promo image untouched
    }
    r = requests.patch(
        f"{BASE}/edits/{edit_id}/listings/{LANGUAGE}",
        headers=headers, data=json.dumps(body), timeout=30,
    )
    if r.status_code != 200:
        print(f"FAILED to patch listing: {r.status_code} {r.text}")
        sys.exit(1)
    print(f"  patched listing OK")
    print(f"  new short:  {r.json().get('shortDescription','')[:80]!r}")
    print(f"  new full chars: {len(r.json().get('fullDescription',''))}")

    # 4. Commit the edit (locks in the changes)
    r = requests.post(f"{BASE}/edits/{edit_id}:commit", headers=headers, timeout=30)
    if r.status_code != 200:
        print(f"FAILED to commit: {r.status_code} {r.text}")
        sys.exit(1)
    print(f"  committed edit {edit_id}")
    print()
    print("DONE. Changes are now visible in Play Console > Main store listing")
    print("(no rollout to Production track happens — that's separate).")


if __name__ == "__main__":
    main()
