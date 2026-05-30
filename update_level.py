import json
import random

def extract_slice(data, start_x, end_x):
    chunk = [o for o in data if start_x <= o['x'] <= end_x]
    if not chunk:
        return {'data': [], 'width': end_x - start_x + 1}
    min_x = min(ob['x'] for ob in chunk)
    normalized = []
    for ob in chunk:
        new_ob = ob.copy()
        new_ob['x'] = ob['x'] - min_x
        normalized.append(new_ob)
    return {'data': normalized, 'width': end_x - start_x + 1}

def fill_level_sequence(patterns, sequence, start_x, end_x, level_data):
    current_x = start_x
    seq_index = 0
    # Set a fixed seed for deterministic level generation
    random.seed(start_x + end_x)
    
    while current_x < end_x - 40:
        key = sequence[seq_index % len(sequence)]
        p = patterns[key]
        for o in p['data']:
            new_o = o.copy()
            new_o['x'] = o['x'] + current_x
            if new_o['x'] < end_x - 10:
                level_data.append(new_o)
        
        # Add random gap (6 to 8 units)
        current_x += p['width'] + random.randint(6, 8)
        seq_index += 1

def inject_items_and_portals(level_data, start_x, end_x, level_index):
    # Avoid overlapping with existing objects
    occupied_positions = set((o['x'], o['y']) for o in level_data)
    
    # Inject coins and hearts at regular intervals
    random.seed(level_index * 999)
    
    # 1. Inject Coins
    coin_x = start_x + 80
    while coin_x < end_x - 50:
        coin_y = 6
        if (coin_x, coin_y) not in occupied_positions:
            level_data.append({"type": "secret_coin", "x": coin_x, "y": coin_y})
        coin_x += 130 + random.randint(-15, 15)
        
    # 2. Inject Hearts
    heart_x = start_x + 150
    while heart_x < end_x - 50:
        heart_y = 7
        if (heart_x, heart_y) not in occupied_positions:
            level_data.append({"type": "heart", "x": heart_x, "y": heart_y})
        heart_x += 240 + random.randint(-20, 20)
        
    # 3. Inject Portals based on Level Index
    if level_index == 1: # Level 2
        # Gravity Portals
        grav_x = start_x + 120
        while grav_x < end_x - 100:
            level_data.append({"type": "portal_gravity_up", "x": grav_x, "y": 6})
            level_data.append({"type": "portal_gravity_down", "x": grav_x + 180, "y": 6})
            grav_x += 600
            
        # Ship / Cube Transitions
        ship_x = start_x + 400
        while ship_x < end_x - 150:
            level_data.append({"type": "portal_ship", "x": ship_x, "y": 6})
            level_data.append({"type": "portal_cube", "x": ship_x + 150, "y": 6})
            ship_x += 800
            
    elif level_index == 2: # Level 3 Boss
        # High-proportion Ship Mode: Player transitions to ship mode most of the time,
        # with brief interludes in ball or cube mode to keep it interesting.
        mode_x = start_x + 300
        while mode_x < end_x - 200:
            # 1. Switch to Ball mode
            level_data.append({"type": "portal_ball", "x": mode_x, "y": 6})
            # 2. Switch back to Ship mode after 150 units
            level_data.append({"type": "portal_ship", "x": mode_x + 150, "y": 6})
            
            # 3. Switch to Cube mode after another 500 units
            level_data.append({"type": "portal_cube", "x": mode_x + 650, "y": 6})
            # 4. Switch back to Ship mode after 150 units
            level_data.append({"type": "portal_ship", "x": mode_x + 800, "y": 6})
            
            # Move X forward by a large chunk (1500 units) to allow long stretches of flying/dodging
            mode_x += 1500

def generate():
    print("Reading rencana_rintangan1.json...")
    with open('rencana_rintangan1.json', 'r') as f:
        data = json.load(f)
    
    # Extract premium high-fidelity slices directly from hand-designed area
    print("Extracting slices A, B, C, D, E from JSON...")
    patterns = {
        'A': extract_slice(data, 21, 29),    # Floor Spike Run / Jump
        'B': extract_slice(data, 56, 71),    # Gravity Switch block stack
        'C': extract_slice(data, 34, 50),    # Block/Spike Step platform
        'D': extract_slice(data, 108, 138),  # Slopes & Steps & Orbs
        'E': extract_slice(data, 77, 89)     # Block corridor / Spike mix
    }
    
    # Sequences as specified by user/walkthrough
    L1_SEQ = ['A', 'B', 'C', 'D', 'E', 'A', 'A', 'A', 'C', 'E', 'E', 'B', 'D', 'D', 'D', 'C', 'C', 'A', 'B', 'B']
    L2_SEQ = ['C', 'A', 'E', 'B', 'D', 'D', 'B', 'E', 'A', 'C', 'C', 'D', 'B', 'E', 'A', 'A', 'E', 'C', 'D', 'B']
    L3_SEQ = ['B', 'A', 'C', 'D', 'E', 'E', 'B', 'A', 'C', 'D', 'D', 'C', 'E', 'B', 'A']
    
    # --- LEVEL 1 GENERATION ---
    print("Generating LEVEL 1...")
    # Keep hand-designed intro up to x = 850
    level1_data = [o.copy() for o in data if o['x'] < 850]
    # Fill the rest with Bag-inspired Sequence up to x = 2966
    fill_level_sequence(patterns, L1_SEQ, 850, 2966, level1_data)
    # Add Finish Lane
    level1_data.append({"type": "block", "x": 2962, "y": 11})
    level1_data.append({"type": "block", "x": 2963, "y": 11})
    # Inject items
    inject_items_and_portals(level1_data, 850, 2966, 0)
    level1_data.sort(key=lambda o: (o['x'], o['y']))
    
    # --- LEVEL 2 GENERATION ---
    print("Generating LEVEL 2...")
    level2_data = []
    fill_level_sequence(patterns, L2_SEQ, 60, 5000, level2_data)
    # Add Finish Lane
    level2_data.append({"type": "block", "x": 4996, "y": 11})
    level2_data.append({"type": "block", "x": 4997, "y": 11})
    # Inject items & portals
    inject_items_and_portals(level2_data, 60, 5000, 1)
    level2_data.sort(key=lambda o: (o['x'], o['y']))
    
    # --- LEVEL 3 (BOSS) GENERATION ---
    print("Generating LEVEL 3 BOSS...")
    # Start with ship portal immediately at x=30
    level3_data = [{"type": "portal_ship", "x": 30, "y": 6}]
    fill_level_sequence(patterns, L3_SEQ, 60, 7000, level3_data)
    # Add Finish Lane
    level3_data.append({"type": "block", "x": 6996, "y": 11})
    level3_data.append({"type": "block", "x": 6997, "y": 11})
    # Inject items & portals
    inject_items_and_portals(level3_data, 60, 7000, 2)
    level3_data.sort(key=lambda o: (o['x'], o['y']))
    
    # Save to generated-levels.js
    print("Saving to js/generated-levels.js...")
    js_content = f"// AUTO-GENERATED LEVEL DATA\n"
    js_content += f"export const LEVEL1_DATA = {json.dumps(level1_data, indent=2)};\n\n"
    js_content += f"export const LEVEL2_DATA = {json.dumps(level2_data, indent=2)};\n\n"
    js_content += f"export const LEVEL3_DATA = {json.dumps(level3_data, indent=2)};\n"
    
    with open('js/generated-levels.js', 'w') as f:
        f.write(js_content)
        
    print(f"Success! Level 1: {len(level1_data)} objects, Level 2: {len(level2_data)} objects, Level 3: {len(level3_data)} objects.")

if __name__ == '__main__':
    generate()
