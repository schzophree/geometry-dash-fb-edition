import json
import random

def generate_level(score_end):
    level_data = []
    current_x = 20
    
    # [A] Pola 1: Blok dasar & Duri di Lantai
    def pattern_A(x): return [{"type": "block", "x": x, "y": 11}, {"type": "block", "x": x+1, "y": 11}, {"type": "block", "x": x+2, "y": 11}, {"type": "spike", "x": x+1, "y": 10}, {"type": "spike", "x": x+2, "y": 10}, {"type": "block", "x": x+3, "y": 11}, {"type": "block", "x": x+4, "y": 11}]
    # [B] Pola 2: Anti-Gravitasi (Terbang ke Atap)
    def pattern_B(x): return [{"type": "portal_gravity_up", "x": x, "y": 8}, {"type": "block", "x": x+5, "y": 0}, {"type": "block", "x": x+6, "y": 0}, {"type": "block", "x": x+7, "y": 0}, {"type": "spike_down", "x": x+5, "y": 1}, {"type": "spike_down", "x": x+6, "y": 1}, {"type": "secret_coin", "x": x+6, "y": 3}, {"type": "portal_gravity_down", "x": x+12, "y": 4}]
    # [C] Pola 3: Lorong Pesawat (Ship)
    def pattern_C(x): return [{"type": "portal_ship", "x": x, "y": 6}, {"type": "block", "x": x+4, "y": 0}, {"type": "block", "x": x+5, "y": 0}, {"type": "block", "x": x+6, "y": 0}, {"type": "spike_down", "x": x+4, "y": 1}, {"type": "spike_down", "x": x+6, "y": 1}, {"type": "block", "x": x+3, "y": 11}, {"type": "block", "x": x+4, "y": 11}, {"type": "block", "x": x+5, "y": 11}, {"type": "spike", "x": x+4, "y": 10}, {"type": "spike", "x": x+5, "y": 10}, {"type": "secret_coin", "x": x+5, "y": 5}, {"type": "portal_cube", "x": x+12, "y": 6}]
    # [D] Pola 4: Tanjakan (Slope) & Platform
    def pattern_D(x): return [{"type": "block", "x": x, "y": 11}, {"type": "slope_right", "x": x+1, "y": 11}, {"type": "block", "x": x+2, "y": 10}, {"type": "block", "x": x+3, "y": 10}, {"type": "spike", "x": x+3, "y": 9}, {"type": "orb_yellow", "x": x+3, "y": 7}, {"type": "platform", "x": x+6, "y": 7}, {"type": "secret_coin", "x": x+6, "y": 6}]
    # [E] Pola 5: Tiga Duri Rapat
    def pattern_E(x): return [{"type": "spike", "x": x, "y": 11}, {"type": "spike", "x": x+1, "y": 11}, {"type": "spike", "x": x+2, "y": 11}, {"type": "orb_green", "x": x+1, "y": 8}]
    
    # Ini adalah 5 Pola Utama kita [A, B, C, D, E]
    templates = [pattern_A, pattern_B, pattern_C, pattern_D, pattern_E]
    max_limit = 3000 if score_end == float('inf') else score_end - 15
    
    # 🌟 IMPLEMENTASI SISTEM ACAK KANTONG (BAG RANDOMIZER) 🌟
    kantong_pola = []

    while current_x < max_limit:
        # Jika kantong kosong, masukkan kembali ke-5 pola dan kocok (shuffle)!
        if not kantong_pola:
            kantong_pola = templates.copy() # Masukkan A, B, C, D, E
            random.shuffle(kantong_pola)    # Acak urutannya menjadi misal C, A, E, B, D
        
        # Ambil pola satu per satu dari kantong (pop)
        template_terpilih = kantong_pola.pop()
        
        # Cetak rintangan ke level
        level_data.extend(template_terpilih(current_x))
        
        # Spasi jarak antar rintangan (6, 7, atau 8 grid)
        current_x += random.randint(6, 8)
        
    level_data.extend([{"type": "block", "x": max_limit + 2, "y": 11}, {"type": "block", "x": max_limit + 3, "y": 11}])
    return level_data

# [BAGIAN PRINT DAN SAVE TETAP SAMA SEPERTI SEBELUMNYA]
print("Generating levels with Bag Randomizer...")
level1_data = generate_level(900)
level2_data = generate_level(2100)
level3_data = generate_level(float('inf'))

output = f"""// AUTO-GENERATED LEVEL DATA
export const LEVEL1_DATA = {json.dumps(level1_data, indent=2)};
export const LEVEL2_DATA = {json.dumps(level2_data, indent=2)};
export const LEVEL3_DATA = {json.dumps(level3_data, indent=2)};
"""

with open('js/generated-levels.js', 'w') as f:
    f.write(output)
print("Sukses! File js/generated-levels.js telah dibuat.")