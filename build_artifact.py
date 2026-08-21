#!/usr/bin/env python3
"""
Generate the single-file version (runs inside Claude) from the PWA source in pwa/.

The two builds differ in exactly three places, each marked in pwa/app.js:
  STORAGE  - localStorage vs Claude's window.storage
  IMGSRC   - image files on disk vs inline base64
  BUILD    - hides the offline downloader where there's no service worker

Everything else is shared, so a feature only ever needs writing once.

    python3 build_artifact.py            # -> fools-almanac.html
"""
import base64, io, json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PWA = os.path.join(HERE, "pwa")
SRC = os.path.join(HERE, "rw/tarot/rider-waite/720px")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "fools-almanac.html")
WIDTH, QUALITY = 180, 64          # keeps the single file near 1.3 MB

STORAGE = '''
async function load(){
  try{const r=await window.storage.get(KEY); if(r&&r.value)S=Object.assign(S,JSON.parse(r.value));}
  catch(e){/* first run: nothing saved yet */}
  render();
}
function save(){
  try{window.storage.set(KEY,JSON.stringify(S));}
  catch(e){toast("Couldn't save that entry. Your work is still on screen \\u2014 try again.");}
}
function exportData(){
  const blob=new Blob([JSON.stringify(S,null,1)],{type:"application/json"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=u;a.download="fools-almanac-"+today()+".json";a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function importData(inp){
  const f=inp.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);
      if(!d||typeof d!=="object"||!("entries" in d))throw 0;
      S=Object.assign({met:{},entries:[],today:null},d); save(); render();
      toast("Journal restored \\u2014 "+S.entries.length+" entries.");}
    catch(e){toast("That file isn't a journal backup.");}};
  r.readAsText(f);
}
const KEY="foolsalmanac:state";
'''

IMGSRC = '''
function imgSrc(c,thumb){return "data:image/webp;base64,"+IMG[c.id];}
'''


def swap(text, tag, replacement):
    pat = re.compile(r"/\*%s-START\*/.*?/\*%s-END\*/" % (tag, tag), re.S)
    if not pat.search(text):
        sys.exit("build failed: %s markers missing from pwa/app.js" % tag)
    return pat.sub(lambda _: replacement.strip(), text)  # lambda: keep backslashes literal


def build_images():
    m = json.load(open(os.path.join(HERE, "map.json")))
    parts, total = [], 0
    for cid, f in m.items():
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        b = io.BytesIO()
        im.save(b, "WEBP", quality=QUALITY, method=6)
        d = base64.b64encode(b.getvalue()).decode()
        total += len(d)
        parts.append('"%s":"%s"' % (cid, d))
    return "const IMG={%s};" % ",".join(parts), total


def main():
    css = open(os.path.join(PWA, "styles.css")).read()
    data = open(os.path.join(PWA, "data.js")).read()
    app = open(os.path.join(PWA, "app.js")).read()

    app = swap(app, "STORAGE", STORAGE)
    app = swap(app, "IMGSRC", IMGSRC)
    app = app.replace('var BUILD="pwa";', 'var BUILD="artifact";', 1)

    imgs, payload = build_images()

    html = (
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        "<style>\n%s\n</style>\n" % css
        + '<div id="app"><div class="panel">Loading\u2026</div></div>\n'
        + "<script>\n%s\n</script>\n" % imgs
        + "<script>\n%s\n</script>\n" % data
        + "<script>\n%s\n</script>\n" % app
    )
    open(OUT, "w").write(html)
    print("built %s  (%.2f MB, images %.0f KB)"
          % (os.path.basename(OUT), len(html) / 1048576, payload / 1024))


if __name__ == "__main__":
    main()
