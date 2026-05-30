import json
import random

def generate_level(score_end):
    level_data = []
    current_x = 20

    # Pola rintangan (sesuai yang kamu minta sebelumnya)
    def pattern_1(x): return [{"type": "block", "x": x, "y": 11}, {"type": "block", "x": x+1, "y": 11}, {"type": "block", "x": x+2, "y": 11}, {"type": "spike", "x": x+1, "y": 10}, {"type": "spike", "x": x+2, "y": 10}, {"type": "block", "x": x+3, "y": 11}, {"type": "block", "x": x+4, "y": 11}]
    def pattern_2(x): return [{"type": "portal_gravity_up", "x": x, "y": 8}, {"type": "block", "x": x+5, "y": 0}, {"type": "block", "x": x+6, "y": 0}, {"type": "block", "x": x+7, "y": 0}, {"type": "spike_down", "x": x+5, "y": 1}, {"type": "spike_down", "x": x+6, "y": 1}, {"type": "secret_coin", "x": x+6, "y": 3}, {"type": "portal_gravity_down", "x": x+12, "y": 4}]
    def pattern_3(x): return [{"type": "portal_ship", "x": x, "y": 6}, {"type": "block", "x": x+4, "y": 0}, {"type": "block", "x": x+5, "y": 0}, {"type": "block", "x": x+6, "y": 0}, {"type": "spike_down", "x": x+4, "y": 1}, {"type": "spike_down", "x": x+6, "y": 1}, {"type": "block", "x": x+3, "y": 11}, {"type": "block", "x": x+4, "y": 11}, {"type": "block", "x": x+5, "y": 11}, {"type": "spike", "x": x+4, "y": 10}, {"type": "spike", "x": x+5, "y": 10}, {"type": "secret_coin", "x": x+5, "y": 5}, {"type": "portal_cube", "x": x+12, "y": 6}]
    def pattern_4(x): return [{"type": "block", "x": x, "y": 11}, {"type": "slope_right", "x": x+1, "y": 11}, {"type": "block", "x": x+2, "y": 10}, {"type": "block", "x": x+3, "y": 10}, {"type": "spike", "x": x+3, "y": 9}, {"type": "orb_yellow", "x": x+3, "y": 7}, {"type": "platform", "x": x+6, "y": 7}, {"type": "secret_coin", "x": x+6, "y": 6}]
    def pattern_5(x): return [{"type": "spike", "x": x, "y": 11}, {"type": "spike", "x": x+1, "y": 11}, {"type": "spike", "x": x+2, "y": 11}, {"type": "orb_green", "x": x+1, "y": 8}]

    templates = [pattern_1, pattern_2, pattern_3, pattern_4, pattern_5]
    max_limit = 3000 if score_end == float('inf') else score_end - 15

    while current_x < max_limit:
        template = random.choice(templates)
        level_data.extend(template(current_x))
        current_x += random.randint(7, 9) # Spasi antar pola

    level_data.extend([{"type": "block", "x": max_limit + 2, "y": 11}, {"type": "block", "x": max_limit + 3, "y": 11}])
    return level_data

# Generate untuk ketiga level
print("Generating levels...")
try:
    with open('rencana_rintangan1.json', 'r') as f:
        source_data = json.load(f)
    print(f"Level 1 source loaded ({len(source_data)} objects)")
    
    # 1. Gunakan bagian awal asli (x=17 s/d x=850)
    level1_data = [obj for obj in source_data if 17 <= obj.get('x', 0) <= 850]
    
    # 2. Ekstraksi Snippet (Potongan-potongan dari data asli)
    # Kita bagi x=17 s/d x=850 menjadi beberapa potongan berukuran ~60 unit
    snippets = []
    snippet_size = 60
    for start_x in range(17, 850, snippet_size):
        end_x = start_x + snippet_size
        # Ambil objek dalam range ini
        chunk = [obj for obj in source_data if start_x <= obj.get('x', 0) < end_x]
        if chunk:
            # Normalisasi x ke 0 agar bisa di-offset nanti
            base_x = min(obj['x'] for obj in chunk)
            normalized_chunk = []
            for obj in chunk:
                new_obj = obj.copy()
                new_obj['x'] = obj['x'] - base_x
                normalized_chunk.append(new_obj)
            
            snippets.append({
                'data': normalized_chunk,
                'width': max(obj['x'] for obj in normalized_chunk) + 1
            })
    
    print(f"Extracted {len(snippets)} snippets from source data.")
    
    # 3. Generasi Adaptif (x=851 s/d x=2960)
    if snippets:
        current_x = 851
        while current_x < 2960:
            # Pilih snippet secara acak
            snip = random.choice(snippets)
            
            # Beri sedikit gap aman (safe gap) antar snippet (7-12 unit)
            gap = random.randint(7, 12)
            current_x += gap
            
            # Tempelkan snippet
            for obj in snip['data']:
                new_obj = obj.copy()
                new_x = current_x + obj['x']
                if new_x <= 2960:
                    new_obj['x'] = new_x
                    level1_data.append(new_obj)
            
            current_x += snip['width']
    
    # 4. Tambahkan garis finish
    level1_data.extend([{"type": "block", "x": 2962, "y": 11}, {"type": "block", "x": 2963, "y": 11}])
    
    # Urutkan berdasarkan x agar rapi
    level1_data.sort(key=lambda o: o['x'])
    print(f"Level 1 Adaptive Assembly complete (Total: {len(level1_data)} objects)")

except Exception as e:
    print(f"Warning: Could not load/assemble Level 1 ({e}). Generating random level 1.")
    level1_data = generate_level(900)

level2_data = generate_level(2100)
level3_data = generate_level(float('inf'))

# Tulis hasil ke dalam satu file JS
output = f"""// AUTO-GENERATED LEVEL DATA
export const LEVEL1_DATA = {json.dumps(level1_data, indent=2)};
export const LEVEL2_DATA = {json.dumps(level2_data, indent=2)};
export const LEVEL3_DATA = {json.dumps(level3_data, indent=2)};
"""

with open('js/generated-levels.js', 'w') as f:
    f.write(output)
print("Sukses! File js/generated-levels.js telah dibuat.")