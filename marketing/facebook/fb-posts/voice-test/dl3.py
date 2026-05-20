"""Download child drawing / painting candidates for Keepsakes post."""
import os, requests, time

OUT = os.path.dirname(os.path.abspath(__file__))
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

IDS = [
    "7885362", "3662630", "5357104", "5789766", "5093988", "5093599",
    "13755604", "7025974", "6964702", "13418660", "6695117", "7031283",
]

ok = 0
for pid in IDS:
    url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=1200"
    path = os.path.join(OUT, f"k_{pid}.jpg")
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        if r.status_code == 200 and len(r.content) > 12000:
            with open(path, "wb") as f:
                f.write(r.content)
            ok += 1
            print(f"  k_{pid}.jpg  {len(r.content)//1024} KB")
        else:
            print(f"  ! {pid} status={r.status_code}")
    except Exception as e:
        print(f"  ! {pid} {e}")
    time.sleep(0.3)
print(f"\n{ok} photos downloaded.")
