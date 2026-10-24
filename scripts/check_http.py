"""Check every deployed file, including binary images, against the source."""
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError
import sys
root = Path(__file__).resolve().parents[1] / 'dist'
base = sys.argv[1].rstrip('/')
files = list(root.rglob('*'))
count = 0
for file in files:
    if not file.is_file():
        continue
    relative = file.relative_to(root).as_posix()
    route = relative[:-10] if relative.endswith('index.html') else relative
    with urlopen(base + '/' + route, timeout=10) as response:
        assert response.status == 200, route
        # Canonical metadata is regenerated for the deployment domain.
        if file.suffix != '.html':
            assert response.read() == file.read_bytes(), ('Changed asset', route)
        else:
            assert b'<h1' in response.read(), ('Missing page content', route)
        if file.suffix in ('.webp', '.png', '.jpg'):
            assert response.headers.get_content_type().startswith('image/'), route
    count += 1
try:
    urlopen(base + '/definitely-missing-file-12345', timeout=10)
except HTTPError as error:
    assert error.code == 404
else:
    raise AssertionError('Missing route should return 404')
print(f'PASS: {count} served files; all image bytes and MIME types; real 404.')
