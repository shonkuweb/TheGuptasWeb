from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
root=Path(__file__).resolve().parents[1]/'dist'
class Page(HTMLParser):
 def __init__(self):
  super().__init__(); self.links=[]; self.ids=[]; self.h1=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1': self.h1+=1
  if 'id' in a: self.ids.append(a['id'])
  if tag=='img': assert 'alt' in a,'Image missing alt'
  for k in ('src','href'):
   if a.get(k): self.links.append(a[k])
pages={}
for p in root.rglob('*.html'):
 q=Page();q.feed(p.read_text());pages[p]=q
 assert q.h1==1,(p,'Expected one H1')
 assert len(q.ids)==len(set(q.ids)),(p,'Duplicate IDs')
for p,q in pages.items():
 for url in q.links:
  u=urlparse(url)
  if u.scheme or u.netloc: continue
  dest=(root/unquote(u.path).lstrip('/')) if u.path.startswith('/') else (p.parent/u.path if u.path else p)
  if dest.is_dir(): dest=dest/'index.html'
  assert dest.exists(),(p,url,'Missing target')
  if u.fragment: assert dest in pages and u.fragment in pages[dest].ids,(p,url,'Missing anchor')
print(f'PASS: {len(pages)} pages; local assets, links, anchors, unique IDs and headings.')
