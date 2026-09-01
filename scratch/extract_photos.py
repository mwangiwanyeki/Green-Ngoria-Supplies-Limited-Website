import urllib.request
import re

url = 'https://photos.google.com/share/AF1QipOv8s11kArG8wfbuNFMaKHkQ96uQ4GCfb8e6WxN0krD3u3n_ZsngPuBOrdkG2Oq-Q?key=WWFWQzFyRS1ySmtGR3F4VUVOWGR3aXllTXozNzZB'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

# Search for any lh3 or googleusercontent strings
all_lh3 = re.findall(r'https://[^\"\'\s<>]+googleusercontent\.com[^\"\'\s<>]*', html)
print('Total googleusercontent references:', len(all_lh3))
for u in set(all_lh3):
    print('URL:', u[:150])
