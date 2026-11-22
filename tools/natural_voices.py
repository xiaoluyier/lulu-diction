"""Fetch the two Piper voices for the static site. Large binaries stay outside git."""
import os, shutil, hashlib
from pathlib import Path
import requests
root=Path(__file__).resolve().parents[1]
dest=root/'site'/'voices'; dest.mkdir(exist_ok=True)
for lang,path in [('fr','fr/fr_FR/siwis/medium/fr_FR-siwis-medium'),('it','it/it_IT/paola/medium/it_IT-paola-medium')]:
    for ext in ['.onnx.json','.onnx','/MODEL_CARD']:
        target=dest/(lang+('-LICENSE.txt' if ext.startswith('/') else ext))
        sha={'fr':'b1d946fd68d0347155fa59bce0a018924abbef3c1561181db45ca463d83963ef','it':'f9b8658aa8c01f8280aa88488f6e7643a639b6225a81514c40440a01f6364a20'}[lang]
        if target.exists() and (hashlib.sha256(target.read_bytes()).hexdigest()==sha if ext=='.onnx' else target.stat().st_size>100):continue
        base=os.environ.get('PIPER_HOST','https://huggingface.co')
        asset=(path.rsplit('/',1)[0] if ext.startswith('/') else path)+ext
        with requests.get(base+'/rhasspy/piper-voices/resolve/main/'+asset,timeout=(20,90),stream=True) as r:
            r.raise_for_status()
            with target.with_suffix('.part').open('wb') as f:
                for chunk in r.iter_content(1024*1024):f.write(chunk)
        if ext=='.onnx' and hashlib.sha256(target.with_suffix('.part').read_bytes()).hexdigest()!=sha:raise ValueError('Unexpected Piper voice checksum')
        target.with_suffix('.part').replace(target)
        print(target.name,target.stat().st_size,flush=True)
runtime=root/'node_modules'/'onnxruntime-web'/'dist'
for name in ['ort.wasm.min.mjs','ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm']:
    shutil.copyfile(runtime/name,dest/name)

