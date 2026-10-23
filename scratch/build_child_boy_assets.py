import os
import math
import numpy as np
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32
REF_HEIGHT = 66
BASE_SCALE = REF_HEIGHT / 197.0  # ~0.335

cells_dir = 'scratch/child_boy_cells'
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

def draw_hatchet_spark(canvas, frame_idx):
    draw = ImageDraw.Draw(canvas)
    arc_color = (254, 240, 138, 240)
    draw.arc([42, 34, 62, 58], start=280, end=70, fill=arc_color, width=2)
    draw.point((58, 42), fill=(255, 255, 255, 255))
    draw.point((59, 42), fill=(254, 215, 170, 255))
    draw.point((58, 41), fill=(254, 215, 170, 255))

def draw_apple_snack(canvas, cx=CENTER_X, cy=52):
    draw = ImageDraw.Draw(canvas)
    # Bright red juicy apple
    draw.ellipse([cx - 4, cy - 3, cx + 3, cy + 4], fill=(220, 38, 38, 255), outline=(127, 29, 29, 255))
    # Green leaf & brown stem
    draw.line([cx - 1, cy - 5, cx - 1, cy - 3], fill=(120, 53, 15, 255), width=1)
    draw.point((cx + 1, cy - 4), fill=(34, 197, 94, 255))

def draw_kindling_bundle(canvas, cx=CENTER_X, cy=48):
    draw = ImageDraw.Draw(canvas)
    # Bundle of small firewood sticks tied with rope
    draw.line([cx - 8, cy - 2, cx + 8, cy - 2], fill=(146, 64, 14, 255), width=2)
    draw.line([cx - 7, cy + 2, cx + 9, cy + 2], fill=(180, 83, 9, 255), width=2)
    draw.line([cx - 9, cy, cx + 7, cy], fill=(120, 53, 15, 255), width=2)
    draw.line([cx, cy - 4, cx, cy + 4], fill=(245, 158, 11, 255), width=1)

def draw_story_book(canvas, cx=CENTER_X, cy=50):
    draw = ImageDraw.Draw(canvas)
    # Small storybook with colorful cover
    draw.polygon([(cx - 8, cy - 3), (cx, cy - 1), (cx + 8, cy - 3),
                  (cx + 8, cy + 5), (cx, cy + 7), (cx - 8, cy + 5)],
                 fill=(250, 245, 230, 255), outline=(37, 99, 235, 255))
    draw.line([cx, cy - 1, cx, cy + 7], fill=(220, 38, 38, 255), width=1)
    draw.point((cx - 4, cy + 2), fill=(234, 88, 12, 255))
    draw.point((cx + 4, cy + 2), fill=(16, 185, 129, 255))

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
    sp_axe_attack = make_char_sprite('axe_attack', scale=BASE_SCALE * 0.88)
    sp_axe_defend = make_char_sprite('axe_defend')
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

    # Row 8: sit (4 frames) - Seated on rustic log
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_sitting, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 8 * CELL_H))

    # Row 9: sleep (4 frames) - Resting leaning on walking stick with Zzz
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, 0, -1, 0][f]
        place_sprite(cell, sp_resting, cx=31, by=BASELINE_Y, dy=breathe_dy)
        draw_zzz(cell, f)
        atlas.paste(cell, (f * CELL_W, 9 * CELL_H))

    # Row 10: eat (4 frames) - Munching on a crunchy sweet red apple
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_apple_snack(cell, cx=28, cy=52 + dy)
        atlas.paste(cell, (f * CELL_W, 10 * CELL_H))

    # Row 11: fight (4 frames) - 4-stage martial & training hatchet sequence
    # Frame 0: Fight Punch!
    # Frame 1: Fight Kick!
    # Frame 2: With Axe (Attack) - training hatchet swing!
    # Frame 3: With Axe (Defend) - two-handed hatchet parry!
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_fight_punch, cx=32, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_fight_kick, cx=33, by=BASELINE_Y, dy=0)
        elif f == 2:
            place_sprite(cell, sp_axe_attack, cx=33, by=BASELINE_Y, dy=0)
            draw_hatchet_spark(cell, 2)
        else:
            place_sprite(cell, sp_axe_defend, cx=32, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 11 * CELL_H))

    # Row 12: carry (4 frames) - Carrying bundle of firewood kindling sticks
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_kindling_bundle(cell, cx=28, cy=48 + dy)
        atlas.paste(cell, (f * CELL_W, 12 * CELL_H))

    # Row 13: emote (4 frames) - Loving closed-eyes smile with floating sparkle hearts
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_loving, cx=31, by=BASELINE_Y, dy=dy)
        draw_heart_sparkle(cell, f)
        atlas.paste(cell, (f * CELL_W, 13 * CELL_H))

    # Row 14: read (4 frames) - Reading illustrated storybook
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        draw_story_book(cell, cx=28, cy=50 + dy)
        atlas.paste(cell, (f * CELL_W, 14 * CELL_H))

    # Row 15: work (4 frames) - Helping forage & gathering sticks with surprised alert stance
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, 1, 0, -1][f]
        place_sprite(cell, sp_surprised, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 15 * CELL_H))

    # Row 16: craft (4 frames) - Whittling wooden toy / sharpening training hatchet
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 1, 0][f]
        place_sprite(cell, sp_axe_defend, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 16 * CELL_H))

    # Row 17: staticWork (4 frames) - Chopping small branches & firewood kindling
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_axe_defend, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 1:
            place_sprite(cell, sp_axe_attack, cx=33, by=BASELINE_Y, dy=0)
        elif f == 2:
            place_sprite(cell, sp_axe_attack, cx=33, by=BASELINE_Y, dy=1)
            draw_hatchet_spark(cell, 2)
        else:
            place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 17 * CELL_H))

    return atlas

def build_npc_portrait():
    # 54x88 portrait for child_boy.png (proportional child size)
    src = cells['front_idle']
    target_h = 88
    target_w = int(round(src.width * target_h / src.height))  # ~46
    resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (54, target_h), (0, 0, 0, 0))
    paste_x = (54 - target_w) // 2
    portrait.paste(resized, (paste_x, 0), resized)
    return portrait

if __name__ == '__main__':
    print('Generating new Child Boy atlas (256x1440)...')
    atlas = build_full_atlas()
    atlas.save('src/assets/animations/child_boy.png')
    print('Saved src/assets/animations/child_boy.png')

    print('Generating new Child Boy portrait (54x88)...')
    portrait = build_npc_portrait()
    portrait.save('src/assets/npcs/child_boy.png')
    print('Saved src/assets/npcs/child_boy.png')
