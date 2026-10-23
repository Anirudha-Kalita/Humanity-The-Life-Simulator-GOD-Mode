import os
import numpy as np
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32

cells_dir = 'scratch/new_pregnant_cells'

def load_cell(name):
    path = f"{cells_dir}/{name}.png"
    return Image.open(path)

def make_char_sprite(name_or_img, max_h=66.0, max_w=58.0, flip_h=False):
    src = load_cell(name_or_img) if isinstance(name_or_img, str) else name_or_img
    w, h = src.size
    scale = min(max_h / h, max_w / w)
    tw = max(1, int(round(w * scale)))
    th = max(1, int(round(h * scale)))
    resized = src.resize((tw, th), Image.Resampling.LANCZOS)
    if flip_h:
        resized = resized.transpose(Image.FLIP_LEFT_RIGHT)
    return resized

def place_sprite(cell, sprite, cx=CENTER_X, by=BASELINE_Y, dx=0, dy=0):
    w, h = sprite.size
    x = int(round(cx - w / 2.0 + dx))
    y = int(round(by - h + dy))
    cell.paste(sprite, (x, y), sprite)

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

def draw_zzz(canvas, frame_idx):
    draw = ImageDraw.Draw(canvas)
    color = (226, 232, 240, 240)
    shadow = (30, 41, 59, 180)
    offsets = [
        (42, 22 - frame_idx * 2, 'z'),
        (46, 15 - frame_idx * 2, 'z'),
        (51, 8 - frame_idx * 2, 'Z'),
    ]
    for ox, oy, letter in offsets:
        if oy > 1:
            draw.text((ox + 1, oy + 1), letter, fill=shadow)
            draw.text((ox, oy), letter, fill=color)

def build_full_atlas():
    atlas = Image.new('RGBA', (CELL_W * 4, CELL_H * 18), (0, 0, 0, 0))

    # Walk Down (Front)
    wf0 = make_char_sprite('walk_front_0')
    wf1 = make_char_sprite('walk_front_1')
    wf3 = make_char_sprite('walk_front_3')
    wf4 = make_char_sprite('walk_front_4')

    # Walk Left - MUST face strictly LEFT (using flipped walk_right frames)
    wl0 = make_char_sprite('walk_right_0', flip_h=True)
    wl2 = make_char_sprite('walk_right_2', flip_h=True)
    wl4 = make_char_sprite('walk_right_4', flip_h=True)
    wl6 = make_char_sprite('walk_right_6', flip_h=True)

    # Walk Up (Back)
    wb0 = make_char_sprite('walk_back_0')
    wb1 = make_char_sprite('walk_back_1')
    wb3 = make_char_sprite('walk_back_3')
    wb4 = make_char_sprite('walk_back_4')

    # Walk Right - MUST face strictly RIGHT (using unflipped walk_right frames)
    wr0 = make_char_sprite('walk_right_0', flip_h=False)
    wr2 = make_char_sprite('walk_right_2', flip_h=False)
    wr4 = make_char_sprite('walk_right_4', flip_h=False)
    wr6 = make_char_sprite('walk_right_6', flip_h=False)

    # Facing Idles:
    # facing_front faces front
    ff = make_char_sprite('facing_front')
    # facing_right has face on left in source -> faces strictly LEFT!
    fl = make_char_sprite('facing_right')
    # facing_back faces back
    fb = make_char_sprite('facing_back')
    # facing_left has face on right in source -> faces strictly RIGHT!
    fr = make_char_sprite('facing_left')

    # Action poses
    sp_sit = make_char_sprite('sitting_front', max_h=65.0)
    sp_sleep = make_char_sprite('sleep_zzz_left', max_h=62.0)
    sp_eat = make_char_sprite('eat_front')
    sp_drink = make_char_sprite('drink_front')
    sp_bend_f = make_char_sprite('bend_front', max_h=65.0)
    sp_bend_l = make_char_sprite('bend_left', max_h=65.0)
    sp_carry = make_char_sprite('carry_items')
    sp_emote_happy = make_char_sprite('emote_happy')
    sp_read = make_char_sprite('reading_front')
    sp_baby_items = make_char_sprite('with_baby_items', max_h=64.0)
    sp_pet = make_char_sprite('with_pet', max_h=64.0)

    # Row 0: walkDown (4 frames) - Front walk cycle
    wf_frames = [wf0, wf1, wf3, wf4]
    wf_dys = [0, -1, 0, -1]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        place_sprite(cell, wf_frames[f], cx=32, by=BASELINE_Y, dy=wf_dys[f])
        atlas.paste(cell, (f * CELL_W, 0 * CELL_H))

    # Row 1: walkLeft (4 frames) - Left walk cycle (faces strictly LEFT)
    wl_frames = [wl0, wl2, wl4, wl6]
    wl_dys = [0, -1, 0, -1]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        place_sprite(cell, wl_frames[f], cx=32, by=BASELINE_Y, dy=wl_dys[f])
        atlas.paste(cell, (f * CELL_W, 1 * CELL_H))

    # Row 2: walkUp (4 frames) - Back walk cycle (faces strictly BACK/UP)
    wb_frames = [wb0, wb1, wb3, wb4]
    wb_dys = [0, -1, 0, -1]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        place_sprite(cell, wb_frames[f], cx=32, by=BASELINE_Y, dy=wb_dys[f])
        atlas.paste(cell, (f * CELL_W, 2 * CELL_H))

    # Row 3: walkRight (4 frames) - Right walk cycle (faces strictly RIGHT)
    wr_frames = [wr0, wr2, wr4, wr6]
    wr_dys = [0, -1, 0, -1]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        place_sprite(cell, wr_frames[f], cx=32, by=BASELINE_Y, dy=wr_dys[f])
        atlas.paste(cell, (f * CELL_W, 3 * CELL_H))

    # Row 4: idleDown (4 frames) - Front idle breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, ff, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 4 * CELL_H))

    # Row 5: idleLeft (4 frames) - Left idle breathing (faces strictly LEFT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, fl, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 5 * CELL_H))

    # Row 6: idleUp (4 frames) - Back idle breathing (faces strictly BACK)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, fb, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 6 * CELL_H))

    # Row 7: idleRight (4 frames) - Right idle breathing (faces strictly RIGHT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, fr, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 7 * CELL_H))

    # Row 8: sit (4 frames) - Seated on wooden stool holding belly
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_sit, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 8 * CELL_H))

    # Row 9: sleep (4 frames) - Cozy in bed with pillow, pink quilt & Zzz
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, 0, -1, 0][f]
        place_sprite(cell, sp_sleep, cx=32, by=BASELINE_Y, dy=dy)
        draw_zzz(cell, f)
        atlas.paste(cell, (f * CELL_W, 9 * CELL_H))

    # Row 10: eat (4 frames) - Eating from bowl & drinking tea
    eat_frames = [sp_eat, sp_drink, sp_eat, sp_drink]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, eat_frames[f], cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 10 * CELL_H))

    # Row 11: fight / defend (4 frames) - Protective bending defense guarding bump
    bend_frames = [sp_bend_f, sp_bend_l, sp_bend_f, sp_bend_l]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, 1][f]
        place_sprite(cell, bend_frames[f], cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 11 * CELL_H))

    # Row 12: carry (4 frames) - Carrying grocery bag with fresh bread & greens
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_carry, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 12 * CELL_H))

    # Row 13: emote (4 frames) - Emoting Happy with celebration sparkles
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_emote_happy, cx=32, by=BASELINE_Y, dy=dy)
        draw_heart_sparkle(cell, f)
        atlas.paste(cell, (f * CELL_W, 13 * CELL_H))

    # Row 14: read (4 frames) - Reading open book
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_read, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 14 * CELL_H))

    # Row 15: work (4 frames) - Tending garden / home cleaning
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        im = sp_bend_f if f < 2 else sp_bend_l
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, im, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 15 * CELL_H))

    # Row 16: craft (4 frames) - Preparing baby clothes & nursery items
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_baby_items, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 16 * CELL_H))

    # Row 17: staticWork (4 frames) - Caring for village pet / home
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, 1][f]
        place_sprite(cell, sp_pet, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 17 * CELL_H))

    return atlas

def build_portrait():
    src = load_cell('facing_front')
    target_h = 130
    target_w = int(round(src.width * target_h / src.height))
    resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (89, 130), (0, 0, 0, 0))
    paste_x = (89 - target_w) // 2
    portrait.paste(resized, (paste_x, 0), resized)
    return portrait

if __name__ == '__main__':
    print("Building new Pregnant Woman atlas (256x1440)...")
    atlas = build_full_atlas()
    atlas.save('src/assets/animations/pregnant_woman.png')
    print("Saved src/assets/animations/pregnant_woman.png")

    print("Building new Pregnant Woman portrait (89x130)...")
    portrait = build_portrait()
    portrait.save('src/assets/npcs/pregnant_woman.png')
    print("Saved src/assets/npcs/pregnant_woman.png")
