import os
import math
import numpy as np
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32
REF_HEIGHT = 66
BASE_SCALE = REF_HEIGHT / 201.0  # ~0.328358

cells_dir = 'scratch/lumberjack_cells'
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
    'axe_attack': Image.open(f'{cells_dir}/3_2_axe_attack.png'),
    'axe_defend': Image.open(f'{cells_dir}/3_3_axe_defend.png'),
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

def draw_axe_strike_spark(canvas, frame_idx):
    draw = ImageDraw.Draw(canvas)
    # Steel blade arc and timber wood chips
    arc_color = (254, 240, 138, 240)
    draw.arc([42, 34, 62, 58], start=280, end=70, fill=arc_color, width=2)
    draw.point((58, 42), fill=(255, 255, 255, 255))
    draw.point((59, 42), fill=(254, 215, 170, 255))
    draw.point((58, 41), fill=(254, 215, 170, 255))
    # Flying wood chip
    draw.rectangle([54, 30, 56, 32], fill=(180, 83, 9, 230))
    draw.rectangle([59, 26, 61, 28], fill=(217, 119, 6, 210))

def draw_canteen_snack(canvas, cx=CENTER_X, cy=52):
    draw = ImageDraw.Draw(canvas)
    # Woodsman leather canteen and roasted bread roll
    draw.ellipse([cx - 8, cy - 2, cx - 2, cy + 6], fill=(120, 53, 15, 255), outline=(50, 20, 10, 255))
    draw.rectangle([cx - 6, cy - 4, cx - 4, cy - 2], fill=(180, 140, 90, 255))
    draw.ellipse([cx + 1, cy - 2, cx + 8, cy + 4], fill=(217, 119, 6, 255), outline=(60, 30, 10, 255))

def draw_timber_logs(canvas, cx=CENTER_X, cy=46):
    draw = ImageDraw.Draw(canvas)
    # Bundle of two freshly cut pine logs with tree bark and cut tree rings
    # Log 1
    draw.rectangle([cx - 10, cy - 4, cx + 8, cy + 2], fill=(120, 53, 15, 255), outline=(40, 20, 10, 255))
    draw.ellipse([cx + 6, cy - 4, cx + 10, cy + 2], fill=(251, 191, 36, 255), outline=(90, 40, 10, 255))
    draw.point((cx + 8, cy - 1), fill=(146, 64, 14, 255))
    # Log 2
    draw.rectangle([cx - 8, cy, cx + 10, cy + 6], fill=(146, 64, 14, 255), outline=(40, 20, 10, 255))
    draw.ellipse([cx + 8, cy, cx + 12, cy + 6], fill=(254, 215, 170, 255), outline=(90, 40, 10, 255))
    draw.point((cx + 10, cy + 3), fill=(146, 64, 14, 255))
    # Rope binding
    draw.line([cx - 2, cy - 4, cx - 2, cy + 6], fill=(245, 158, 11, 255), width=1)

def draw_forestry_map(canvas, cx=CENTER_X, cy=48):
    draw = ImageDraw.Draw(canvas)
    # Forestry parchment with pine tree symbols
    draw.polygon([(cx - 9, cy - 4), (cx, cy - 2), (cx + 9, cy - 4),
                  (cx + 9, cy + 5), (cx, cy + 7), (cx - 9, cy + 5)],
                 fill=(250, 245, 230, 255), outline=(120, 53, 15, 255))
    draw.line([cx, cy - 2, cx, cy + 7], fill=(146, 64, 14, 255), width=1)
    # Tree icons on map
    draw.point((cx - 5, cy), fill=(22, 101, 52, 255))
    draw.point((cx - 5, cy + 1), fill=(22, 101, 52, 255))
    draw.point((cx + 4, cy + 2), fill=(22, 101, 52, 255))
    draw.point((cx + 4, cy + 3), fill=(22, 101, 52, 255))

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
    # Scale axe poses slightly so wide axe swings fit comfortably within 64px
    sp_axe_attack = make_char_sprite('axe_attack', scale=BASE_SCALE * 0.88)
    sp_axe_defend = make_char_sprite('axe_defend', scale=BASE_SCALE * 0.85)
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

    # Row 8: sit (4 frames) - Seated on cut timber tree log
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_sitting, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 8 * CELL_H))

    # Row 9: sleep (4 frames) - Resting leaning on axe with Zzz
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, 0, -1, 0][f]
        place_sprite(cell, sp_resting, cx=31, by=BASELINE_Y, dy=breathe_dy)
        draw_zzz(cell, f)
        atlas.paste(cell, (f * CELL_W, 9 * CELL_H))

    # Row 10: eat (4 frames) - Eating woodsman meal with wooden canteen
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_canteen_snack(cell, cx=28, cy=52 + dy)
        atlas.paste(cell, (f * CELL_W, 10 * CELL_H))

    # Row 11: fight (4 frames) - 4-stage martial & axe combat sequence
    # Frame 0: Fight Punch!
    # Frame 1: Fight Kick!
    # Frame 2: With Axe (Attack) - giant chopping swing!
    # Frame 3: With Axe (Defend) - two-handed axe parry!
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_fight_punch, cx=32, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_fight_kick, cx=33, by=BASELINE_Y, dy=0)
        elif f == 2:
            place_sprite(cell, sp_axe_attack, cx=33, by=BASELINE_Y, dy=0)
            draw_axe_strike_spark(cell, 2)
        else:
            place_sprite(cell, sp_axe_defend, cx=32, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 11 * CELL_H))

    # Row 12: carry (4 frames) - Carrying freshly felled pine timber logs
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_timber_logs(cell, cx=28, cy=48 + dy)
        atlas.paste(cell, (f * CELL_W, 12 * CELL_H))

    # Row 13: emote (4 frames) - Loving pose with smiling closed eyes and floating hearts
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_loving, cx=31, by=BASELINE_Y, dy=dy)
        draw_heart_sparkle(cell, f)
        atlas.paste(cell, (f * CELL_W, 13 * CELL_H))

    # Row 14: read (4 frames) - Checking forestry timber map
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_forestry_map(cell, cx=28, cy=50 + dy)
        atlas.paste(cell, (f * CELL_W, 14 * CELL_H))

    # Row 15: work (4 frames) - Foraging and surveying forest timber
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, 1, 0, -1][f]
        place_sprite(cell, sp_surprised, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 15 * CELL_H))

    # Row 16: craft (4 frames) - Woodworking & plank crafting with defensive axe guard
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 1, 0][f]
        place_sprite(cell, sp_axe_defend, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 16 * CELL_H))

    # Row 17: staticWork (4 frames) - Powerful tree felling axe chop!
    # Frame 0: High axe preparation
    # Frame 1: Full swing forward
    # Frame 2: Heavy impact with spark
    # Frame 3: Follow-through
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_axe_defend, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 1:
            place_sprite(cell, sp_axe_attack, cx=33, by=BASELINE_Y, dy=0)
        elif f == 2:
            place_sprite(cell, sp_axe_attack, cx=33, by=BASELINE_Y, dy=1)
            draw_axe_strike_spark(cell, 2)
        else:
            place_sprite(cell, sp_axe_attack, cx=32, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 17 * CELL_H))

    return atlas

def build_npc_portrait():
    # 89x133 portrait for lumberjack.png and woodcutter.png
    src = cells['front_idle']
    target_h = 133
    target_w = int(round(src.width * target_h / src.height))  # ~93
    resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (89, target_h), (0, 0, 0, 0))
    # Center crop / paste
    paste_x = (89 - target_w) // 2
    portrait.paste(resized, (paste_x, 0), resized)
    return portrait

if __name__ == '__main__':
    print('Generating new Lumberjack/Woodcutter atlas (256x1440)...')
    atlas = build_full_atlas()
    atlas.save('src/assets/animations/lumberjack.png')
    atlas.save('src/assets/animations/woodcutter.png')
    print('Saved src/assets/animations/lumberjack.png and woodcutter.png')

    print('Generating new Lumberjack/Woodcutter portrait (89x133)...')
    portrait = build_npc_portrait()
    portrait.save('src/assets/npcs/lumberjack.png')
    portrait.save('src/assets/npcs/woodcutter.png')
    print('Saved src/assets/npcs/lumberjack.png and woodcutter.png')
