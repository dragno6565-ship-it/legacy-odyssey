"""Upload Pinterest pin images to Supabase Storage and return public URLs."""
import os
import requests
import json

SUPABASE_URL = "https://vesaydfwwdbbajydbzmq.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc2F5ZGZ3d2RiYmFqeWRiem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNDMxNiwiZXhwIjoyMDg3MjgwMzE2fQ.hIepr4IPBV98LWvpb-TNs_LjUaP7_8e_gXDSlc7Jr0k"
BUCKET = "pinterest-pins"
PINS_DIR = r"F:\legacy-odyssey\pinterest-pins"

headers = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
}

# ── 1. Ensure bucket exists and is public ─────────────────────────────────────
def ensure_bucket():
    # List buckets
    r = requests.get(f"{SUPABASE_URL}/storage/v1/bucket", headers=headers)
    buckets = r.json()
    exists = any(b.get("name") == BUCKET for b in (buckets if isinstance(buckets, list) else []))
    if not exists:
        r2 = requests.post(f"{SUPABASE_URL}/storage/v1/bucket", headers={**headers, "Content-Type": "application/json"},
                           data=json.dumps({"id": BUCKET, "name": BUCKET, "public": True}))
        print(f"Bucket created: {r2.status_code} {r2.text[:100]}")
    else:
        # Make sure it's public
        r3 = requests.put(f"{SUPABASE_URL}/storage/v1/bucket/{BUCKET}", headers={**headers, "Content-Type": "application/json"},
                          data=json.dumps({"public": True}))
        print(f"Bucket updated to public: {r3.status_code}")

# ── 2. Upload each pin ────────────────────────────────────────────────────────
def upload_pin(filename):
    filepath = os.path.join(PINS_DIR, filename)
    with open(filepath, "rb") as f:
        data = f.read()
    upload_headers = {
        **headers,
        "Content-Type": "image/png",
        "x-upsert": "true",  # overwrite if exists
    }
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}",
        headers=upload_headers,
        data=data
    )
    if r.status_code in (200, 201):
        url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
        return url
    else:
        print(f"  ERROR uploading {filename}: {r.status_code} {r.text[:200]}")
        return None

# ── Main ──────────────────────────────────────────────────────────────────────
print("Setting up Supabase bucket...")
ensure_bucket()

pins = sorted([f for f in os.listdir(PINS_DIR) if f.startswith("pin") and f.endswith(".png")])
print(f"\nUploading {len(pins)} pins...\n")

urls = {}
for pin in pins:
    url = upload_pin(pin)
    if url:
        print(f"  ok  {pin}")
        print(f"      {url}")
        urls[pin] = url
    print()

print(f"\nDone — {len(urls)}/{len(pins)} pins uploaded.")
print("\n=== URL MAP ===")
for k, v in urls.items():
    print(f"{k}: {v}")
