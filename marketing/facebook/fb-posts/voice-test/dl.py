"""Download selected Pexels photos from the CDN by ID."""
import os, requests, time

OUT = os.path.dirname(os.path.abspath(__file__))
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

SETS = {
    "grumpy":  ["14407425", "9152681", "18545434", "3845455", "6392861", "6219874"],
    "surprised": ["33321459", "14383642", "12995725", "14757299", "8621352", "2505061"],
    "messy":   ["11787679", "4867364", "4881007", "7946746", "5357426", "7328557"],
    "yawn":    ["3600870", "9189193", "30654962", "10600024", "16852508", "7828243"],
}

ok = 0
for cat, ids in SETS.items():
    for pid in ids:
        url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=1200"
        path = os.path.join(OUT, f"{cat}_{pid}.jpg")
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            if r.status_code == 200 and len(r.content) > 12000:
                with open(path, "wb") as f:
                    f.write(r.content)
                ok += 1
                print(f"  {cat}_{pid}.jpg  {len(r.content)//1024} KB")
            else:
                print(f"  ! {pid} status={r.status_code} size={len(r.content)}")
        except Exception as e:
            print(f"  ! {pid} {e}")
        time.sleep(0.3)
print(f"\n{ok} photos downloaded.")
