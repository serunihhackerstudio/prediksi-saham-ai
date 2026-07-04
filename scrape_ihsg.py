import pandas as pd
import json
import urllib.request

url = 'https://id.wikipedia.org/wiki/Daftar_emiten_Bursa_Efek_Indonesia'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read()
    
    tables = pd.read_html(html)
    stocks = []
    
    for df in tables:
        cols = [c.lower() for c in df.columns]
        kode_col = None
        nama_col = None
        
        for c in df.columns:
            if 'kode' in c.lower():
                kode_col = c
            if 'nama' in c.lower() or 'perusahaan' in c.lower():
                nama_col = c
                
        if kode_col and nama_col:
            for _, row in df.iterrows():
                kode = str(row[kode_col]).strip()
                nama = str(row[nama_col]).strip()
                if len(kode) == 4 and kode.isalpha():
                    stocks.append({
                        "symbol": f"{kode}.JK",
                        "name": nama
                    })
    
    # Remove duplicates
    unique_stocks = []
    seen = set()
    for s in stocks:
        if s['symbol'] not in seen:
            unique_stocks.append(s)
            seen.add(s['symbol'])
            
    output_path = 'frontend/src/data/stocks.json'
    import os
    os.makedirs('frontend/src/data', exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(unique_stocks, f, indent=2, ensure_ascii=False)
    
    print(f"Success: Saved {len(unique_stocks)} stocks to {output_path}")
except Exception as e:
    print(f"Error: {e}")
