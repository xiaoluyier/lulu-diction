"""Package official small Vosk models in the archive layout expected by vosk-browser."""
import pathlib, tarfile, zipfile, concurrent.futures, time, hashlib
import requests
root = pathlib.Path(__file__).resolve().parents[1]
cache=root/'.cache'; cache.mkdir(exist_ok=True)
dest=root/'site'/'assets'; dest.mkdir(parents=True,exist_ok=True)
def prepare(lang):
    name='vosk-model-small-'+lang+'-0.22'
    archive=cache/(name+'.zip')
    for attempt in range(4):
        try:
            if not zipfile.is_zipfile(archive):
                with requests.get('https://alphacephei.com/vosk/models/'+name+'.zip',stream=True,timeout=(15,100)) as resp:
                    resp.raise_for_status()
                    with archive.open('wb') as out:
                        for chunk in resp.iter_content(262144): out.write(chunk)
            assert hashlib.sha256(archive.read_bytes()).hexdigest()=={'fr':'cabf6180e177eb9b3a9a9d43a437bd5e549f3a7d09525e5d69a3fed787be12ad','it':'9ec65e75861d1c6c2e457cccd932705340dcdf233f5b239f00733b4de0bf3267'}[lang], 'Model checksum mismatch'
            with zipfile.ZipFile(archive) as z, tarfile.open(dest/(lang+'-model.tar.gz'),'w:gz',compresslevel=6) as tar:
                dirs=sorted({parent.as_posix() for entry in z.infolist() for parent in pathlib.PurePosixPath('model',pathlib.PurePosixPath(entry.filename).relative_to(name)).parents if parent.as_posix()!='.'},key=lambda p:(p.count('/'),p))
                for item in dirs:
                    d=tarfile.TarInfo(item+'/');d.type=tarfile.DIRTYPE;d.mode=0o755;d.mtime=1700000000;tar.addfile(d)
                for entry in z.infolist():
                    rel=pathlib.PurePosixPath(entry.filename).relative_to(name)
                    if entry.is_dir(): continue
                    info=tarfile.TarInfo('model/'+rel.as_posix()); info.size=entry.file_size;info.mtime=1700000000
                    with z.open(entry) as stream: tar.addfile(info,stream)
            print(lang,(dest/(lang+'-model.tar.gz')).stat().st_size,flush=True)
            return
        except Exception:
            if attempt==3: raise
            time.sleep(1)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: list(pool.map(prepare,['fr','it']))

