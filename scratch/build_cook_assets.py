import os
import math
import numpy as np
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32
REF_HEIGHT = 66
BASE_SCALE = REF_HEIGHT / 195.0  # ~0.3385

cells_dir = 'scratch/cook_cells'
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
    'spoon_attack': Image.open(f'{cells_dir}/3_2_spoon_attack.png'),
    'spoon_defend': Image.open(f'{cells_dir}/3_3_spoon_defend.png'),
    'tired': Image.open(f'{cells_dir}/3_4_tired.png'),
}

def make_char_sprite(img_key, scale=BASE_SCALE, flip_h=False):
    src = cells[img_key]
    tw = max(1, int(round(src.width * scale)))
    th = max(1, int(round(src.height * scale)))
    resized = src.resize((tw, th), Image.Resampling.LANCZOS)
    if flip_h:
        resized = resized.transpose(Image.FLIP_LEFT_RIGHT)
    return resized

def place_sprite(canvas, sprite, cx=CENTER_X, by=BASELINE_Y, dx=0, dy=0):
    w, h = sprite.size
    x = int(round(cx - w / 2.0 + dx))
    y = int(round(by - h + dy))
    canvas.paste(sprite, (x, y), sprite)

def draw_zzz(canvas, frame_idx):
    draw = ImageDraw.Draw(canvas)
    color = (226, 232, 240, 240)
    shadow = (30, 41, 59, 180)
    offsets = [
        (40, 22 - frame_idx * 2, 'z'),
        (44, 15 - frame_idx * 2, 'z'),
        (49, 8 - frame_idx * 2, 'Z'),
    ]
    for ox, oy, letter in offsets:
        if oy > 1:
            draw.text((ox + 1, oy + 1), letter, fill=shadow)
            draw.text((ox, oy), letter, fill=color)

def draw_heart_sparkle(canvas, frame_idx):
    draw = ImageDraw.Draw(canvas)
    sx = 53
    sy = 16 + (frame_idx % 2) * -1
    sparkle_color = (255, 235, 245, 230)
    draw.point((sx, sy), fill=sparkle_color)
    draw.point((sx - 1, sy), fill=(255, 180, 210, 160))
    draw.point((sx + 1, sy), fill=(255, 180, 210, 160))
    draw.point((sx, sy - 1), fill=(255, 180, 210, 160))
    draw.point((sx, sy + 1), fill=(255, 180, 210, 160))

def draw_tasting_bowl(canvas, cx=CENTER_X, cy=52):
    draw = ImageDraw.Draw(canvas)
    # Clay tasting bowl with savory stew
    draw.ellipse([cx - 7, cy - 2, cx + 7, cy + 4], fill=(180, 83, 9, 255), outline=(50, 25, 10, 255))
    draw.ellipse([cx - 5, cy - 1, cx + 5, cy + 2], fill=(234, 88, 12, 255))
    draw.point((cx - 2, cy - 5), fill=(240, 240, 240, 140))
    draw.point((cx + 2, cy - 6), fill=(240, 240, 240, 140))

def draw_bread_basket(canvas, cx=CENTER_X, cy=46):
    draw = ImageDraw.Draw(canvas)
    w, h = 16, 12
    x0, y0 = cx - w // 2, cy - h // 2
    # Wicker bread basket with fresh golden loaves
    draw.rectangle([x0, y0, x0 + w, y0 + h], fill=(180, 130, 70, 255), outline=(60, 40, 20, 255))
    draw.line([x0 + 2, y0 + h // 2, x0 + w - 2, y0 + h // 2], fill=(130, 90, 40, 255))
    # Golden baked bread buns
    draw.ellipse([x0 + 2, y0 - 3, x0 + 8, y0 + 3], fill=(217, 119, 6, 255))
    draw.ellipse([x0 + 8, y0 - 4, x0 + 14, y0 + 2], fill=(245, 158, 11, 255))

def draw_recipe_book(canvas, cx=CENTER_X, cy=48):
    draw = ImageDraw.Draw(canvas)
    # Antique recipe book with pastry illustration
    draw.polygon([(cx - 9, cy - 4), (cx, cy - 2), (cx + 9, cy - 4),
                  (cx + 9, cy + 5), (cx, cy + 7), (cx - 9, cy + 5)],
                 fill=(250, 245, 230, 255), outline=(120, 53, 15, 255))
    draw.line([cx, cy - 2, cx, cy + 7], fill=(185, 28, 28, 255), width=1)
    draw.line([cx - 7, cy - 1, cx - 2, cy - 1], fill=(120, 90, 60, 255))
    draw.line([cx - 7, cy + 2, cx - 2, cy + 2], fill=(120, 90, 60, 255))
    draw.line([cx + 2, cy - 1, cx + 7, cy - 1], fill=(120, 90, 60, 255))
    draw.line([cx + 2, cy + 2, cx + 7, cy + 2], fill=(120, 90, 60, 255))

def draw_spoon_strike_spark(canvas, frame_idx):
    if frame_idx == 2:
        draw = ImageDraw.Draw(canvas)
        # Metal shine on spoon strike
        arc_color = (254, 240, 138, 240)
        draw.arc([42, 34, 62, 58], start=280, end=70, fill=arc_color, width=2)
        draw.point((58, 42), fill=(255, 255, 255, 255))
        draw.point((59, 42), fill=(254, 215, 170, 255))
        draw.point((58, 41), fill=(254, 215, 170, 255))

def build_full_atlas():
    atlas = Image.new('RGBA', (CELL_W * 4, CELL_H * 18), (0, 0, 0, 0))

    # Pre-render scaled sprites
    sp_front_idle = make_char_sprite('front_idle')
    # Left idle MUST face left (flip because source cell is facing right)
    sp_left_idle = make_char_sprite('left_idle', flip_h=True)
    sp_right_idle = make_char_sprite('right_idle')
    sp_back_idle = make_char_sprite('back_idle')

    sp_front_walk = make_char_sprite('front_walk')
    # Left walk MUST face left (flip because source cell is facing right)
    sp_left_walk = make_char_sprite('left_walk', flip_h=True)
    sp_left_walk_step2 = make_char_sprite('right_walk', flip_h=True)
    # Right walk faces right
    sp_right_walk = make_char_sprite('right_walk')
    sp_right_walk_step2 = make_char_sprite('left_walk')
    sp_back_walk = make_char_sprite('back_walk')

    sp_sitting = make_char_sprite('sitting')
    sp_resting = make_char_sprite('resting')
    # Scale loving slightly (~0.31) so hearts stay cleanly inside 64px frame
    sp_loving = make_char_sprite('loving', scale=BASE_SCALE * 0.92)
    sp_angry = make_char_sprite('angry')
    sp_surprised = make_char_sprite('surprised')

    sp_fight_punch = make_char_sprite('fight_punch')
    sp_fight_kick = make_char_sprite('fight_kick')
    # Scale spoon_attack slightly (~0.30) so wide spoon stays inside frame
    sp_spoon_attack = make_char_sprite('spoon_attack', scale=BASE_SCALE * 0.89)
    sp_spoon_defend = make_char_sprite('spoon_defend')
    sp_tired = make_char_sprite('tired')

    # Row 0: walkDown (4 frames) - Front walk cycle
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_front_walk, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_front_walk, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 0 * CELL_H))

    # Row 1: walkLeft (4 frames) - Left walk cycle (faces LEFT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_left_walk, cx=33, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_left_idle, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_left_walk_step2, cx=31, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_left_idle, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 1 * CELL_H))

    # Row 2: walkUp (4 frames) - Back walk cycle
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_back_walk, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_back_idle, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_back_walk, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_back_idle, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 2 * CELL_H))

    # Row 3: walkRight (4 frames) - Right walk cycle (faces RIGHT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_right_walk, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_right_idle, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_right_walk_step2, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_right_idle, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 3 * CELL_H))

    # Row 4: idleDown (4 frames) - Front idle with breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 4 * CELL_H))

    # Row 5: idleLeft (4 frames) - Left idle with breathing (faces LEFT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_left_idle, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 5 * CELL_H))

    # Row 6: idleUp (4 frames) - Back idle with breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_back_idle, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 6 * CELL_H))

    # Row 7: idleRight (4 frames) - Right idle with breathing (faces RIGHT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_right_idle, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 7 * CELL_H))

    # Row 8: sit (4 frames) - Seated on wooden crate holding spoon
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_sitting, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 8 * CELL_H))

    # Row 9: sleep (4 frames) - Resting leaning on spoon with Zzz
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, 0, -1, 0][f]
        place_sprite(cell, sp_resting, cx=31, by=BASELINE_Y, dy=breathe_dy)
        draw_zzz(cell, f)
        atlas.paste(cell, (f * CELL_W, 9 * CELL_H))

    # Row 10: eat (4 frames) - Tasting savory stew with her spoon
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_tasting_bowl(cell, cx=28, cy=52 + dy)
        atlas.paste(cell, (f * CELL_W, 10 * CELL_H))

    # Row 11: fight (4 frames) - 4-stage martial & spoon combat sequence
    # Frame 0: Fight Punch!
    # Frame 1: Fight Kick!
    # Frame 2: With Spoon (Attack) - giant spoon strike!
    # Frame 3: With Spoon (Defend) - two-handed guard!
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_fight_punch, cx=32, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_fight_kick, cx=32, by=BASELINE_Y, dy=0)
        elif f == 2:
            place_sprite(cell, sp_spoon_attack, cx=33, by=BASELINE_Y, dy=0)
            draw_spoon_strike_spark(cell, 2)
        else:
            place_sprite(cell, sp_spoon_defend, cx=32, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 11 * CELL_H))

    # Row 12: carry (4 frames) - Carrying freshly baked bread basket
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_bread_basket(cell, cx=28, cy=48 + dy)
        atlas.paste(cell, (f * CELL_W, 12 * CELL_H))

    # Row 13: emote (4 frames) - Loving pose with smiling closed eyes and floating hearts
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_loving, cx=31, by=BASELINE_Y, dy=dy)
        draw_heart_sparkle(cell, f)
        atlas.paste(cell, (f * CELL_W, 13 * CELL_H))

    # Row 14: read (4 frames) - Studying a recipe cookbook
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_recipe_book(cell, cx=28, cy=50 + dy)
        atlas.paste(cell, (f * CELL_W, 14 * CELL_H))

    # Row 15: work (4 frames) - Foraging cooking ingredients with surprised alert stance
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, 1, 0, -1][f]
        place_sprite(cell, sp_surprised, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 15 * CELL_H))

    # Row 16: craft (4 frames) - Kitchen prep & kneading dough with spoon defend
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 1, 0][f]
        place_sprite(cell, sp_spoon_defend, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 16 * CELL_H))

    # Row 17: staticWork (4 frames) - Active cooking & pot stirring with spoon attack!
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, 1][f]
        place_sprite(cell, sp_spoon_attack, cx=33, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 17 * CELL_H))

    return atlas

def build_npc_portrait():
    # 89x131 portrait for cook.png and baker.png
    src = cells['front_idle']
    target_h = 131
    target_w = int(round(src.width * target_h / src.height)) # ~89
    resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (target_w, 131), (0, 0, 0, 0))
    portrait.paste(resized, (0, 0), resized)
    return portrait

if __name__ == '__main__':
    print('Generating new Cook/Baker atlas (256x1440)...')
    atlas = build_full_atlas()
    atlas.save('src/assets/animations/cook.png')
    atlas.save('src/assets/animations/baker.png')
    print('Saved src/assets/animations/cook.png & baker.png successfully!')

    print('Generating new Cook/Baker portrait (89x131)...')
    portrait = build_npc_portrait()
    portrait.save('src/assets/npcs/cook.png')
    portrait.save('src/assets/npcs/baker.png')
    print('Saved src/assets/npcs/cook.png & baker.png successfully!')
