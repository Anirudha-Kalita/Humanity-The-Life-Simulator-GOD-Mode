from PIL import Image

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32
REF_HEIGHT = 66
BASE_SCALE = REF_HEIGHT / 200.0

cells_dir = 'scratch/forager_cells'
cells = {
    'front_idle': Image.open(f'{cells_dir}/0_0_front_idle.png'),
    'left_idle': Image.open(f'{cells_dir}/0_1_left_idle.png'),
    'right_idle': Image.open(f'{cells_dir}/0_2_right_idle.png'),
    'back_idle': Image.open(f'{cells_dir}/0_3_back_idle.png'),
    'front_walk': Image.open(f'{cells_dir}/1_0_front_walk.png'),
    'left_walk': Image.open(f'{cells_dir}/1_1_left_walk.png'),
    'right_walk': Image.open(f'{cells_dir}/1_2_right_walk.png'),
    'back_walk': Image.open(f'{cells_dir}/1_3_back_walk.png'),
    'sitting': Image.open(f'{cells_dir}/2_0_sitting.png'),
    'resting': Image.open(f'{cells_dir}/2_1_resting.png'),
    'loving': Image.open(f'{cells_dir}/2_2_loving.png'),
    'angry': Image.open(f'{cells_dir}/2_3_angry.png'),
    'surprised': Image.open(f'{cells_dir}/2_4_surprised.png'),
    'fight_punch': Image.open(f'{cells_dir}/3_0_fight_punch.png'),
    'fight_kick': Image.open(f'{cells_dir}/3_1_fight_kick.png'),
    'basket_attack': Image.open(f'{cells_dir}/3_2_basket_attack.png'),
    'basket_defend': Image.open(f'{cells_dir}/3_3_basket_defend.png'),
    'tired': Image.open(f'{cells_dir}/3_4_tired.png'),
}

def test_sprite(key, scale_mult=1.0, flip_h=False, dx=0, dy=0):
    scale = BASE_SCALE * scale_mult
    src = cells[key]
    tw = max(1, int(round(src.width * scale)))
    th = max(1, int(round(src.height * scale)))
    resized = src.resize((tw, th), Image.Resampling.LANCZOS)
    if flip_h:
        resized = resized.transpose(Image.FLIP_LEFT_RIGHT)
    
    cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    x = int(round(CENTER_X - tw / 2.0 + dx))
    y = int(round(BASELINE_Y - th + dy))
    cell.paste(resized, (x, y), resized)
    
    bbox = cell.getbbox()
    clip_x0 = x < 0
    clip_x1 = (x + tw) > CELL_W
    clip_y0 = y < 0
    clip_y1 = (y + th) > CELL_H
    print(f"{key:15s} (scale={scale_mult:.2f}, dx={dx:+2d}): x=[{x:2d}, {x+tw:2d}], y=[{y:2d}, {y+th:2d}], bbox={bbox}, clip=({clip_x0},{clip_x1},{clip_y0},{clip_y1})")

print("--- Testing Standing Poses ---")
test_sprite('front_idle')
test_sprite('left_idle', flip_h=True)
test_sprite('right_idle')
test_sprite('back_idle')
test_sprite('front_walk')
test_sprite('left_walk', flip_h=True)
test_sprite('right_walk')
test_sprite('back_walk')

print("\n--- Testing Action Poses ---")
test_sprite('sitting')
test_sprite('resting')
test_sprite('loving')
test_sprite('angry')
test_sprite('surprised')
test_sprite('fight_punch')
test_sprite('fight_kick', scale_mult=0.92, dx=1)
test_sprite('basket_attack', scale_mult=0.90, dx=1)
test_sprite('basket_defend')
test_sprite('tired')
