# Optimise the Wegwijzers database for Pihka (http-vfs): slim FTS indexes, facet/sort indexes, 8 KB pages.
# Usage: python scripts/optimise_db.py SRC.db DST.db pihka/app/config.json  (then new release + pihka/release.json)
import sqlite3, sys, os, shutil, time, json
src, dst, cfgp = sys.argv[1:4]
if os.path.exists(dst): os.remove(dst)
shutil.copy(src, dst)
cfg = json.load(open(cfgp, encoding='utf-8'))
c = sqlite3.connect(dst); c.execute('pragma journal_mode=delete')
FTS = {
 'actoren': ['name','familienaam','voornaam','beroepen','adressen'],
 'alfabetisch': ['name','beroep','tekst','advertentie'],
 'per_beroep': ['name','tekst','detail'],
 'per_straat': ['name','beroep','tekst'],
 'stratenlijst': ['name','naam_fr','omschrijving','tekst'],
}
for t, cols in FTS.items():
    c.execute(f'drop table "{t}_fts"')
    q = ', '.join(f'"{x}"' for x in cols)
    c.execute(f'''create virtual table "{t}_fts" using fts5({q}, content='{t}', content_rowid='id', tokenize='trigram remove_diacritics 1')''')
    c.execute(f'''insert into "{t}_fts"("{t}_fts") values('rebuild')''')
    c.execute(f'''insert into "{t}_fts"("{t}_fts") values('optimize')''')
    c.commit(); print('fts', t, flush=True)
# indexes on facet columns
have = {r[0] for r in c.execute("select name from sqlite_master where type='index'")}
for p in cfg['perspectives']:
    t = p['table']
    for f in p['facets']:
        n = f"{t}_{f['field']}"
        if n not in have:
            c.execute(f'create index "{n}" on "{t}"("{f["field"]}")'); have.add(n)
c.commit()
c.execute('analyze'); c.commit()
c.execute('pragma page_size=8192'); c.execute('vacuum'); c.commit()
print('pages', c.execute('pragma page_size').fetchone(), c.execute('pragma page_count').fetchone())
print('integrity', c.execute('pragma integrity_check').fetchone())
