settlers = [
    {'name': 'Bram Vance', 'gender': 'male', 'age': 35, 'role': 'lumberjack', 'pregnant': False},
    {'name': 'Talia Thorne', 'gender': 'female', 'age': 26, 'role': 'forager', 'pregnant': False},
    {'name': 'Finn Gale', 'gender': 'male', 'age': 24, 'role': 'fisher', 'pregnant': False},
    {'name': 'Aria Sol', 'gender': 'female', 'age': 28, 'role': 'cook', 'pregnant': False},
    {'name': 'Kaelen Stone', 'gender': 'male', 'age': 33, 'role': 'hunter', 'pregnant': False},
    {'name': 'Elder Bron', 'gender': 'male', 'age': 62, 'role': 'elder', 'pregnant': False},
    {'name': 'Leo Vance', 'gender': 'male', 'age': 10, 'role': 'settler', 'pregnant': False},
    {'name': 'Ivy Sol', 'gender': 'female', 'age': 9, 'role': 'settler', 'pregnant': False},
    {'name': 'Clara Stone', 'gender': 'female', 'age': 28, 'role': 'settler', 'pregnant': True},
    {'name': 'Toby Stone', 'gender': 'male', 'age': 2, 'role': 'toddler', 'pregnant': False},
]

SPEED_SCALE = 0.80

def get_profile(s):
    is_toddler = s['age'] <= 3 or s['role'] == 'toddler'
    is_pregnant = s['pregnant']
    is_elder = s['age'] >= 60 or s['role'] == 'elder'
    is_male = s['gender'] == 'male'

    if is_toddler:
        raw_w, raw_r, raw_f = 34, 48, 54
        pace = 'Crawling (Hands & Knees)'
    elif is_pregnant:
        raw_w, raw_r, raw_f = 57, 72, 85
        pace = '0.72x Maternal Rest'
    elif is_elder:
        raw_w, raw_r, raw_f = 59, 78, 92
        pace = '0.75x Cane Stride'
    elif s['age'] < 16:
        raw_w = 65 if is_male else 62
        raw_r = 116 if is_male else 110
        raw_f = 132 if is_male else 126
        pace = '0.65x Apprentice'
    elif not is_male:
        raw_w = 75 if s['role'] == 'forager' else 73
        raw_r = 138 if s['role'] == 'forager' else 135
        raw_f = 148
        pace = '1.35x Nimble Forage' if s['role'] == 'forager' else '1.40x Master Culinary'
    else:
        raw_w = 80 if s['role'] in ['hunter', 'fisher'] else 79 if s['role'] == 'lumberjack' else 78
        raw_r = 146 if s['role'] == 'hunter' else 145 if s['role'] == 'fisher' else 142
        raw_f = 160
        pace = '1.35x High Impact' if s['role'] == 'lumberjack' else '1.30x Quick Draw' if s['role'] == 'hunter' else '1.25x Reflex Catch'

    w = int(round(raw_w * SPEED_SCALE))
    r = int(round(raw_r * SPEED_SCALE))
    f = int(round(raw_f * SPEED_SCALE))
    road = int(round(w * 1.20))
    return {'walk': w, 'run': r, 'flee': f, 'road': road, 'pace': pace}

print(f"{'Settler':15s} | {'Role':10s} | {'Age':3s} | {'Walk':5s} | {'Run':5s} | {'Flee':5s} | {'Road':5s} | {'Pacing'}")
print('-' * 78)
for s in settlers:
    p = get_profile(s)
    print(f"{s['name']:15s} | {s['role']:10s} | {s['age']:3d} | {p['walk']:3d}px | {p['run']:3d}px | {p['flee']:3d}px | {p['road']:3d}px | {p['pace']}")
