import os
import math
import numpy as np
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32
REF_HEIGHT = 66
BASE_SCALE = REF_HEIGHT / 200.0  # 0.33

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

def draw_flying_leaves(canvas, frame_idx):
    draw = ImageDraw.Draw(canvas)
    # Extra swirling green herb leaves thrown forward
    leaves = [
        (56, 36, (34, 197, 94, 240)),
        (59, 32, (22, 163, 74, 230)),
        (54, 44, (74, 222, 128, 220)),
        (61, 42, (21, 128, 61, 230)),
    ]
    for lx, ly, col in leaves:
        draw.ellipse([lx - 1, ly - 2, lx + 2, ly + 2], fill=col)

def draw_berry_snack(canvas, cx=CENTER_X, cy=52):
    draw = ImageDraw.Draw(canvas)
    # Plump wild blueberries & raspberries being tasted
    draw.ellipse([cx - 4, cy - 2, cx - 1, cy + 1], fill=(59, 130, 246, 255), outline=(30, 58, 138, 255))
    draw.ellipse([cx, cy - 3, cx + 3, cy], fill=(225, 29, 72, 255), outline=(136, 19, 55, 255))
    draw.ellipse([cx + 2, cy - 1, cx + 5, cy + 2], fill=(147, 51, 234, 255), outline=(88, 28, 135, 255))

def draw_wild_mushrooms_basket(canvas, cx=CENTER_X, cy=46):
    draw = ImageDraw.Draw(canvas)
    # Wicker basket overflowing with wild red mushrooms & purple forest berries
    w, h = 16, 12
    x0, y0 = cx - w // 2, cy - h // 2
    draw.rectangle([x0, y0, x0 + w, y0 + h], fill=(180, 130, 70, 255), outline=(60, 40, 20, 255))
    draw.line([x0 + 2, y0 + h // 2, x0 + w - 2, y0 + h // 2], fill=(130, 90, 40, 255))
    # Red mushroom cap with white dots
    draw.ellipse([x0 + 2, y0 - 4, x0 + 8, y0 + 2], fill=(220, 38, 38, 255), outline=(127, 29, 29, 255))
    draw.point((x0 + 4, y0 - 2), fill=(255, 255, 255, 255))
    draw.point((x0 + 6, y0 - 1), fill=(255, 255, 255, 255))
    # Forest berries
    draw.ellipse([x0 + 8, y0 - 3, x0 + 12, y0 + 1], fill=(147, 51, 234, 255))
    draw.ellipse([x0 + 11, y0 - 2, x0 + 15, y0 + 2], fill=(37, 99, 235, 255))

def draw_herbal_guide(canvas, cx=CENTER_X, cy=48):
    draw = ImageDraw.Draw(canvas)
    # Pressed flower botanical parchment
    draw.polygon([(cx - 9, cy - 4), (cx, cy - 2), (cx + 9, cy - 4),
                  (cx + 9, cy + 5), (cx, cy + 7), (cx - 9, cy + 5)],
                 fill=(250, 245, 230, 255), outline=(120, 53, 15, 255))
    draw.line([cx, cy - 2, cx, cy + 7], fill=(146, 64, 14, 255), width=1)
    # Pressed leaf icon
    draw.line([cx - 5, cy + 3, cx - 2, cy - 1], fill=(22, 101, 52, 255), width=1)
    draw.point((cx - 3, cy), fill=(34, 197, 94, 255))
    # Pressed red blossom icon
    draw.point((cx + 5, cy), fill=(225, 29, 72, 255))
    draw.point((cx + 4, cy + 1), fill=(244, 63, 94, 255))
    draw.point((cx + 6, cy + 1), fill=(244, 63, 94, 255))

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
    sp_loving = make_char_sprite('loving')
    sp_angry = make_char_sprite('angry')
    sp_surprised = make_char_sprite('surprised')

    sp_fight_punch = make_char_sprite('fight_punch')
    sp_fight_kick = make_char_sprite('fight_kick', scale=BASE_SCALE * 0.92)
    sp_basket_attack = make_char_sprite('basket_attack', scale=BASE_SCALE * 0.90)
    sp_basket_defend = make_char_sprite('basket_defend')
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

    # Row 8: sit (4 frames) - Seated on rustic crate with foraging basket
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_sitting, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 8 * CELL_H))

    # Row 9: sleep (4 frames) - Resting leaning head on basket with Zzz
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, 0, -1, 0][f]
        place_sprite(cell, sp_resting, cx=31, by=BASELINE_Y, dy=breathe_dy)
        draw_zzz(cell, f)
        atlas.paste(cell, (f * CELL_W, 9 * CELL_H))

    # Row 10: eat (4 frames) - Tasting freshly picked sweet forest berries
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_berry_snack(cell, cx=28, cy=52 + dy)
        atlas.paste(cell, (f * CELL_W, 10 * CELL_H))

    # Row 11: fight (4 frames) - 4-stage martial & basket sequence
    # Frame 0: Fight Punch!
    # Frame 1: Fight Kick!
    # Frame 2: With Basket (Attack) - swinging basket throwing out leaves!
    # Frame 3: With Basket (Defend) - holding basket up to block!
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_fight_punch, cx=32, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_fight_kick, cx=33, by=BASELINE_Y, dy=0)
        elif f == 2:
            place_sprite(cell, sp_basket_attack, cx=33, by=BASELINE_Y, dy=0)
            draw_flying_leaves(cell, 2)
        else:
            place_sprite(cell, sp_basket_defend, cx=32, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 11 * CELL_H))

    # Row 12: carry (4 frames) - Carrying wicker basket overflowing with wild mushrooms & berries
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_wild_mushrooms_basket(cell, cx=28, cy=48 + dy)
        atlas.paste(cell, (f * CELL_W, 12 * CELL_H))

    # Row 13: emote (4 frames) - Loving pose with smiling closed eyes and floating hearts
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_loving, cx=31, by=BASELINE_Y, dy=dy)
        draw_heart_sparkle(cell, f)
        atlas.paste(cell, (f * CELL_W, 13 * CELL_H))

    # Row 14: read (4 frames) - Studying pressed botanical herbal guide
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_herbal_guide(cell, cx=28, cy=50 + dy)
        atlas.paste(cell, (f * CELL_W, 14 * CELL_H))

    # Row 15: work (4 frames) - Active foraging & searching for wild herbs in bushes
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, 1, 0, -1][f]
        place_sprite(cell, sp_surprised, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 15 * CELL_H))

    # Row 16: craft (4 frames) - Sorting herbs & basket preparation
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 1, 0][f]
        place_sprite(cell, sp_basket_defend, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 16 * CELL_H))

    # Row 17: staticWork (4 frames) - Harvesting wild herbs and plants into basket!
    # Frame 0: Reaching out into bush
    # Frame 1: Plucking herbs with basket
    # Frame 2: Gathering with floating leaves
    # Frame 3: Stashing herbs in basket
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_basket_defend, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 1:
            place_sprite(cell, sp_basket_attack, cx=33, by=BASELINE_Y, dy=0)
        elif f == 2:
            place_sprite(cell, sp_basket_attack, cx=33, by=BASELINE_Y, dy=1)
            draw_flying_leaves(cell, 2)
        else:
            place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 17 * CELL_H))

    return atlas

def build_npc_portrait():
    # 89x130 portrait for female_farmer.png and forager.png
    src = cells['front_idle']
    target_h = 130
    target_w = int(round(src.width * target_h / src.height))  # ~79
    resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (89, target_h), (0, 0, 0, 0))
    paste_x = (89 - target_w) // 2
    portrait.paste(resized, (paste_x, 0), resized)
    return portrait

if __name__ == '__main__':
    print('Generating new Forager/Female Farmer atlas (256x1440)...')
    atlas = build_full_atlas()
    atlas.save('src/assets/animations/female_farmer.png')
    atlas.save('src/assets/animations/forager.png')
    print('Saved src/assets/animations/female_farmer.png and forager.png')

    print('Generating new Forager/Female Farmer portrait (89x130)...')
    portrait = build_npc_portrait()
    portrait.save('src/assets/npcs/female_farmer.png')
    portrait.save('src/assets/npcs/forager.png')
    print('Saved src/assets/npcs/female_farmer.png and forager.png')
