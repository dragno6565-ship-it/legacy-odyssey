"""Scrape Pexels search results for candidate funny/relatable baby photos."""
import os, re, time, requests

OUT = os.path.dirname(os.path.abspath(__file__))
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

TERMS = [
    "grumpy-baby", "baby-funny-face", "surprised-baby",
    "baby-eating-mess", "baby-crying", "angry-baby",
]

def photo_ids(term):
    url = f"https://www.pexels.com/search/{term}/"
    try:
        html = requests.get(url, headers=HEADERS, timeout=20).text
    except Exception as e:
        print(f"  ! fetch failed {term}: {e}")
        return []
    ids = re.findall(r"images\.pexels\.com/photos/(\d+)/", html)
    seen, out = set(), []
    for i in ids:
        if i not in seen:
            seen.add(i); out.append(i)
    return out[:6]

def download(pid, term, n):
    url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=1200"
    path = os.path.join(OUT, f"cand_{term}_{n}_{pid}.jpg")
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        if r.status_code == 200 and len(r.content) > 15000:
            with open(path, "wb") as f:
                f.write(r.content)
            print(f"  saved {os.path.basename(path)} ({len(r.content)//1024} KB)")
            return path
    except Exception as e:
        print(f"  ! dl failed {pid}: {e}")
    return None

if __name__ == "__main__":
    total = 0
    for term in TERMS:
        print(f"[{term}]")
        for n, pid in enumerate(photo_ids(term), 1):
            if download(pid, term, n):
                total += 1
            time.sleep(0.4)
        time.sleep(1)
    print(f"\nDone. {total} candidate photos in {OUT}")
