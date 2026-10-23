import os
import math
import numpy as np
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32
REF_HEIGHT = 66
BASE_SCALE = REF_HEIGHT / 263.0  # ~0.25095

cells_dir = 'scratch/cells'
cells = {
    'idle_front': Image.open(f'{cells_dir}/0_0_idle_front.png'),
    'standing_3quarter': Image.open(f'{cells_dir}/0_1_standing_3quarter.png'),
    'side_idle_right': Image.open(f'{cells_dir}/0_2_side_idle_right.png'),
    'back_view': Image.open(f'{cells_dir}/0_3_back_view.png'),
    'sit': Image.open(f'{cells_dir}/1_0_sit.png'),
    'neutral_front': Image.open(f'{cells_dir}/1_1_neutral_front.png'),
    'walk_right': Image.open(f'{cells_dir}/1_2_walk_right.png'),
    'emote_heart': Image.open(f'{cells_dir}/1_3_emote_heart.png'),
    'fight_angry': Image.open(f'{cells_dir}/2_0_fight_angry.png'),
    'fight_stance': Image.open(f'{cells_dir}/2_1_fight_stance.png'),
    'surprised_work': Image.open(f'{cells_dir}/2_2_surprised_work.png'),
    'sleep_rest': Image.open(f'{cells_dir}/2_3_sleep_rest.png'),
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
    # Pixel art Zzz letters drifting above the sleeping elder
    draw = ImageDraw.Draw(canvas)
    color = (226, 232, 240, 240)
    shadow = (30, 41, 59, 180)
    
    # 3 letters drifting upward
    offsets = [
        (42, 22 - frame_idx * 2, 'z'),
        (46, 15 - frame_idx * 2, 'z'),
        (51, 8 - frame_idx * 2, 'Z'),
    ]
    for ox, oy, letter in offsets:
        if oy > 1:
            draw.text((ox + 1, oy + 1), letter, fill=shadow)
            draw.text((ox, oy), letter, fill=color)

def draw_heart_sparkle(canvas, frame_idx):
    # Subtle sparkle near heart for emote
    draw = ImageDraw.Draw(canvas)
    sx = 54
    sy = 14 + (frame_idx % 2) * -1
    sparkle_color = (255, 230, 240, 220)
    draw.point((sx, sy), fill=sparkle_color)
    draw.point((sx - 1, sy), fill=(255, 180, 200, 160))
    draw.point((sx + 1, sy), fill=(255, 180, 200, 160))
    draw.point((sx, sy - 1), fill=(255, 180, 200, 160))
    draw.point((sx, sy + 1), fill=(255, 180, 200, 160))

def draw_bowl(canvas, cx=CENTER_X, cy=52):
    # Small wooden bowl with warm stew for eating
    draw = ImageDraw.Draw(canvas)
    # Bowl body
    draw.ellipse([cx - 7, cy - 2, cx + 7, cy + 4], fill=(138, 77, 34, 255), outline=(50, 25, 10, 255))
    # Stew inside
    draw.ellipse([cx - 5, cy - 1, cx + 5, cy + 2], fill=(217, 119, 6, 255))
    # Steam
    draw.point((cx - 2, cy - 5), fill=(240, 240, 240, 140))
    draw.point((cx + 2, cy - 6), fill=(240, 240, 240, 140))

def draw_crate(canvas, cx=CENTER_X, cy=46):
    # Wooden supply crate for carrying
    draw = ImageDraw.Draw(canvas)
    w, h = 16, 13
    x0, y0 = cx - w // 2, cy - h // 2
    # Crate base
    draw.rectangle([x0, y0, x0 + w, y0 + h], fill=(160, 105, 50, 255), outline=(60, 35, 15, 255))
    # Planks and X brace
    draw.line([x0 + 2, y0 + h // 2, x0 + w - 2, y0 + h // 2], fill=(110, 70, 30, 255))
    draw.line([x0 + 2, y0 + 2, x0 + w - 2, y0 + h - 2], fill=(110, 70, 30, 255))
    draw.line([x0 + w - 2, y0 + 2, x0 + 2, y0 + h - 2], fill=(110, 70, 30, 255))

def draw_book(canvas, cx=CENTER_X, cy=48):
    # Ancient leather-bound book / scroll for reading
    draw = ImageDraw.Draw(canvas)
    # Open book pages
    draw.polygon([(cx - 9, cy - 4), (cx, cy - 2), (cx + 9, cy - 4),
                  (cx + 9, cy + 5), (cx, cy + 7), (cx - 9, cy + 5)],
                 fill=(248, 241, 228, 255), outline=(60, 30, 15, 255))
    # Spine & bookmark ribbon
    draw.line([cx, cy - 2, cx, cy + 7], fill=(185, 28, 28, 255), width=1)
    # Text lines on left and right pages
    draw.line([cx - 7, cy - 1, cx - 2, cy - 1], fill=(120, 100, 80, 255))
    draw.line([cx - 7, cy + 2, cx - 2, cy + 2], fill=(120, 100, 80, 255))
    draw.line([cx + 2, cy - 1, cx + 7, cy - 1], fill=(120, 100, 80, 255))
    draw.line([cx + 2, cy + 2, cx + 7, cy + 2], fill=(120, 100, 80, 255))

def draw_strike_effect(canvas, frame_idx):
    if frame_idx == 2:
        draw = ImageDraw.Draw(canvas)
        # Dynamic slash / strike arc
        arc_color = (254, 240, 138, 220)
        draw.arc([40, 35, 62, 60], start=300, end=70, fill=arc_color, width=2)
        # Impact spark
        draw.point((56, 45), fill=(255, 255, 255, 255))
        draw.point((57, 45), fill=(254, 215, 170, 255))
        draw.point((56, 44), fill=(254, 215, 170, 255))

def build_full_atlas():
    atlas = Image.new('RGBA', (CELL_W * 4, CELL_H * 18), (0, 0, 0, 0))

    # Pre-render scaled sprites
    sp_front = make_char_sprite('idle_front')
    sp_neutral = make_char_sprite('neutral_front')
    sp_side_r = make_char_sprite('side_idle_right')
    sp_side_l = make_char_sprite('side_idle_right', flip_h=True)
    sp_walk_r = make_char_sprite('walk_right')
    sp_walk_l = make_char_sprite('walk_right', flip_h=True)
    sp_back = make_char_sprite('back_view')
    sp_sit = make_char_sprite('sit')
    sp_sleep = make_char_sprite('sleep_rest')
    sp_fight_angry = make_char_sprite('fight_angry')
    sp_fight_stance = make_char_sprite('fight_stance')
    sp_emote = make_char_sprite('emote_heart')
    sp_work = make_char_sprite('surprised_work')

    # Row 0: walkDown (4 frames)
    # Front walk cycle: left step, passing, right step, passing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_front, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_neutral, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_front, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_neutral, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 0 * CELL_H))

    # Row 1: walkLeft (4 frames)
    # Left walk cycle using flipped walk_right and side_idle_right
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_walk_l, cx=33, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_side_l, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_walk_l, cx=31, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_side_l, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 1 * CELL_H))

    # Row 2: walkUp (4 frames)
    # Back walk cycle
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_back, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_back, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_back, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_back, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 2 * CELL_H))

    # Row 3: walkRight (4 frames)
    # Right walk cycle using walk_right and side_idle_right
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_walk_r, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_side_r, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_walk_r, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_side_r, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 3 * CELL_H))

    # Row 4: idleDown (4 frames) - Front idle with subtle breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_front, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 4 * CELL_H))

    # Row 5: idleLeft (4 frames) - Left idle with subtle breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_side_l, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 5 * CELL_H))

    # Row 6: idleUp (4 frames) - Back idle with subtle breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_back, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 6 * CELL_H))

    # Row 7: idleRight (4 frames) - Right idle with subtle breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_side_r, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 7 * CELL_H))

    # Row 8: sit (4 frames) - Actual seated elder pose holding cane between knees
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_sit, cx=32, by=BASELINE_Y, dy=breathe_dy)
        atlas.paste(cell, (f * CELL_W, 8 * CELL_H))

    # Row 9: sleep (4 frames) - Actual hunched resting on cane with Zzz
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        breathe_dy = [0, 0, -1, 0][f]
        place_sprite(cell, sp_sleep, cx=30, by=BASELINE_Y, dy=breathe_dy)
        draw_zzz(cell, f)
        atlas.paste(cell, (f * CELL_W, 9 * CELL_H))

    # Row 10: eat (4 frames) - Seated/standing eating hot stew from wooden bowl
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_neutral, cx=32, by=BASELINE_Y, dy=dy)
        draw_bowl(cell, cx=32, cy=52 + dy)
        atlas.paste(cell, (f * CELL_W, 10 * CELL_H))

    # Row 11: fight (4 frames) - Dynamic cane & martial combat routine
    # Frame 0: Angry fist shake! (fight_angry)
    # Frame 1: Two-handed martial staff stance! (fight_stance)
    # Frame 2: Staff strike thrust forward!
    # Frame 3: Strike impact / recovery
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_fight_angry, cx=32, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_fight_stance, cx=32, by=BASELINE_Y, dy=0)
        elif f == 2:
            place_sprite(cell, sp_fight_stance, cx=35, by=BASELINE_Y, dy=-1)
            draw_strike_effect(cell, 2)
        else:
            place_sprite(cell, sp_fight_stance, cx=33, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 11 * CELL_H))

    # Row 12: carry (4 frames) - Carrying wooden crate with steps
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_neutral, cx=32, by=BASELINE_Y, dy=dy)
        draw_crate(cell, cx=32, cy=48 + dy)
        atlas.paste(cell, (f * CELL_W, 12 * CELL_H))

    # Row 13: emote (4 frames) - Happy eyes closed with floating pink heart from image
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_emote, cx=31, by=BASELINE_Y, dy=dy)
        draw_heart_sparkle(cell, f)
        atlas.paste(cell, (f * CELL_W, 13 * CELL_H))

    # Row 14: read (4 frames) - Scholarly reading ancient tome
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_neutral, cx=32, by=BASELINE_Y, dy=dy)
        draw_book(cell, cx=32, cy=50 + dy)
        atlas.paste(cell, (f * CELL_W, 14 * CELL_H))

    # Row 15: work (4 frames) - Foraging / harvesting herbs with alert cane motion
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, 1, 0, -1][f]
        place_sprite(cell, sp_work, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 15 * CELL_H))

    # Row 16: craft (4 frames) - Building / crafting workbench action
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 1, 0][f]
        place_sprite(cell, sp_work, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 16 * CELL_H))

    # Row 17: staticWork (4 frames) - Active working swing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_fight_stance, cx=32, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_work, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_fight_stance, cx=33, by=BASELINE_Y, dy=1)
        else:
            place_sprite(cell, sp_work, cx=32, by=BASELINE_Y, dy=0)
        atlas.paste(cell, (f * CELL_W, 17 * CELL_H))

    return atlas

def build_npc_portrait():
    # 64x106 single sprite for src/assets/npcs/elderly_man.png
    src = cells['idle_front']
    target_h = 106
    target_w = int(round(src.width * target_h / src.height)) # ~61
    resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (64, 106), (0, 0, 0, 0))
    x = (64 - target_w) // 2
    portrait.paste(resized, (x, 0), resized)
    return portrait

if __name__ == '__main__':
    print('Generating new Elder Man atlas (256x1440)...')
    atlas = build_full_atlas()
    atlas.save('src/assets/animations/elderly_man.png')
    print('Saved src/assets/animations/elderly_man.png successfully!')

    print('Generating new Elder Man portrait (64x106)...')
    portrait = build_npc_portrait()
    portrait.save('src/assets/npcs/elderly_man.png')
    print('Saved src/assets/npcs/elderly_man.png successfully!')
