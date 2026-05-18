"""Download candidate photos for the useful post."""
import os, requests, time

OUT = os.path.dirname(os.path.abspath(__file__))
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

SETS = {
    "sleep": ["14219543", "14927270", "4621192", "6589009", "19532665", "10998327"],
    "diaper": ["7491332", "7282221", "7282478", "6624239", "6393191", "3536632"],
}

ok = 0
for cat, ids in SETS.items():
    for pid in ids:
        url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=1200"
        path = os.path.join(OUT, f"u_{cat}_{pid}.jpg")
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            if r.status_code == 200 and len(r.content) > 12000:
                with open(path, "wb") as f:
                    f.write(r.content)
                ok += 1
                print(f"  u_{cat}_{pid}.jpg  {len(r.content)//1024} KB")
            else:
                print(f"  ! {pid} status={r.status_code}")
        except Exception as e:
            print(f"  ! {pid} {e}")
        time.sleep(0.3)
print(f"\n{ok} photos downloaded.")
