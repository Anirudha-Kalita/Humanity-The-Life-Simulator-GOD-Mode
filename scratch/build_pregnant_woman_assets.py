import os
import numpy as np
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32

poses_dir = 'scratch/pregnant_poses'
poses = {
    'walking': Image.open(f"{poses_dir}/walking.png"),
    'drinking_water': Image.open(f"{poses_dir}/drinking_water.png"),
    'cleaning': Image.open(f"{poses_dir}/cleaning.png"),
    'shopping': Image.open(f"{poses_dir}/shopping.png"),
    'relaxing': Image.open(f"{poses_dir}/relaxing.png"),
    'resting': Image.open(f"{poses_dir}/resting.png"),
    'reading': Image.open(f"{poses_dir}/reading.png"),
    'cooking': Image.open(f"{poses_dir}/cooking.png"),
    'preparing_food': Image.open(f"{poses_dir}/preparing_food.png"),
    'with_family': Image.open(f"{poses_dir}/with_family.png"),
    'stretching': Image.open(f"{poses_dir}/stretching.png"),
    'preparing_baby': Image.open(f"{poses_dir}/preparing_baby.png"),
    'gardening': Image.open(f"{poses_dir}/gardening.png"),
    'front_idle': Image.open(f"{poses_dir}/front_idle.png"),
    'front_step1': Image.open(f"{poses_dir}/front_step1.png"),
    'front_step2': Image.open(f"{poses_dir}/front_step2.png"),
    'side_walk_s1': Image.open(f"{poses_dir}/side_walk_s1.png"),
    'side_walk_pass': Image.open(f"{poses_dir}/side_walk_pass.png"),
    'side_walk_s2': Image.open(f"{poses_dir}/side_walk_s2.png"),
    'back_idle': Image.open(f"{poses_dir}/back_idle.png"),
    'back_step1': Image.open(f"{poses_dir}/back_step1.png"),
    'back_step2': Image.open(f"{poses_dir}/back_step2.png"),
}

def make_pose_sprite(key_or_img, max_w=58.0, max_h=66.0, flip_h=False):
    src = poses[key_or_img] if isinstance(key_or_img, str) else key_or_img
    w, h = src.size
    scale = min(max_h / h, max_w / w, 0.55)
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

def build_full_atlas():
    atlas = Image.new('RGBA', (CELL_W * 4, CELL_H * 18), (0, 0, 0, 0))

    # Pre-render scaled sprites
    sp_front_idle = make_pose_sprite('front_idle')
    sp_front_step1 = make_pose_sprite('front_step1')
    sp_front_step2 = make_pose_sprite('front_step2')

    sp_side_walk_s1 = make_pose_sprite('side_walk_s1')
    sp_side_walk_pass = make_pose_sprite('side_walk_pass')
    sp_side_walk_s2 = make_pose_sprite('side_walk_s2')

    sp_left_walk_s1 = make_pose_sprite('side_walk_s1', flip_h=True)
    sp_left_walk_pass = make_pose_sprite('side_walk_pass', flip_h=True)
    sp_left_walk_s2 = make_pose_sprite('side_walk_s2', flip_h=True)

    sp_back_idle = make_pose_sprite('back_idle')
    sp_back_step1 = make_pose_sprite('back_step1')
    sp_back_step2 = make_pose_sprite('back_step2')

    sp_relaxing = make_pose_sprite('relaxing')
    sp_resting = make_pose_sprite('resting')
    sp_eating = make_pose_sprite('drinking_water')
    sp_stretch = make_pose_sprite('stretching')
    sp_shopping = make_pose_sprite('shopping')
    sp_family = make_pose_sprite('with_family')
    sp_reading = make_pose_sprite('reading')
    sp_cleaning = make_pose_sprite('cleaning')
    sp_gardening = make_pose_sprite('gardening')
    sp_prep_baby = make_pose_sprite('preparing_baby')
    sp_prep_food = make_pose_sprite('preparing_food')
    sp_cooking = make_pose_sprite('cooking')

    # Row 0: walkDown (4 frames) - Front walk cycle with authentic foot stepping & maternal waddle
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_front_step1, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_front_step2, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 0 * CELL_H))

    # Row 1: walkLeft (4 frames) - Left walk cycle (faces strictly LEFT, active leg strides)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_left_walk_s1, cx=33, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_left_walk_pass, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_left_walk_s2, cx=31, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_left_walk_pass, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 1 * CELL_H))

    # Row 2: walkUp (4 frames) - Back walk cycle (faces strictly BACK/UP)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_back_step1, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_back_idle, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_back_step2, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_back_idle, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 2 * CELL_H))

    # Row 3: walkRight (4 frames) - Right walk cycle (faces strictly RIGHT, active leg strides)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        if f == 0:
            place_sprite(cell, sp_side_walk_s1, cx=31, by=BASELINE_Y, dy=0)
        elif f == 1:
            place_sprite(cell, sp_side_walk_pass, cx=32, by=BASELINE_Y, dy=-1)
        elif f == 2:
            place_sprite(cell, sp_side_walk_s2, cx=33, by=BASELINE_Y, dy=0)
        else:
            place_sprite(cell, sp_side_walk_pass, cx=32, by=BASELINE_Y, dy=-1)
        atlas.paste(cell, (f * CELL_W, 3 * CELL_H))

    # Row 4: idleDown (4 frames) - Front idle facing forward with gentle breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_front_idle, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 4 * CELL_H))

    # Row 5: idleLeft (4 frames) - Left idle with breathing (faces strictly LEFT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_left_walk_pass, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 5 * CELL_H))

    # Row 6: idleUp (4 frames) - Back idle with breathing (faces strictly BACK/UP)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_back_idle, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 6 * CELL_H))

    # Row 7: idleRight (4 frames) - Right idle with breathing (faces strictly RIGHT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_side_walk_pass, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 7 * CELL_H))

    # Row 8: sit (4 frames) - Relaxing in armchair holding warm tea
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_relaxing, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 8 * CELL_H))

    # Row 9: sleep (4 frames) - Resting in bed with Zzz
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, 0, -1, 0][f]
        place_sprite(cell, sp_resting, cx=31, by=BASELINE_Y, dy=dy)
        draw_zzz(cell, f)
        atlas.paste(cell, (f * CELL_W, 9 * CELL_H))

    # Row 10: eat (4 frames) - Drinking water / healthy nourishment
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_eating, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 10 * CELL_H))

    # Row 11: fight (4 frames) - Prenatal stretching / protective posture
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, 1][f]
        place_sprite(cell, sp_stretch, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 11 * CELL_H))

    # Row 12: carry (4 frames) - Walking carrying shopping basket
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_shopping, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 12 * CELL_H))

    # Row 13: emote (4 frames) - With family / tender touch with floating hearts
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_family, cx=31, by=BASELINE_Y, dy=dy)
        draw_heart_sparkle(cell, f)
        atlas.paste(cell, (f * CELL_W, 13 * CELL_H))

    # Row 14: read (4 frames) - Reading parenting storybook in chair
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_reading, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 14 * CELL_H))

    # Row 15: work (4 frames) - House cleaning with broom & gardening
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        im = sp_cleaning if f < 2 else sp_gardening
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, im, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 15 * CELL_H))

    # Row 16: craft (4 frames) - Preparing baby clothes & food preparation
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        im = sp_prep_baby if f < 2 else sp_prep_food
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, im, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 16 * CELL_H))

    # Row 17: staticWork (4 frames) - Cooking & stirring pot at the hearth
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, 1][f]
        place_sprite(cell, sp_cooking, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 17 * CELL_H))

    return atlas

def build_npc_portrait():
    # 89x130 portrait for pregnant_woman.png
    src = Image.open('scratch/pregnant_poses/front_idle.png')
    target_h = 130
    target_w = int(round(src.width * target_h / src.height))
    resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (89, 130), (0, 0, 0, 0))
    paste_x = (89 - target_w) // 2
    portrait.paste(resized, (paste_x, 0), resized)
    return portrait

if __name__ == '__main__':
    print("Generating Pregnant Woman animation atlas (256x1440)...")
    atlas = build_full_atlas()
    atlas.save('src/assets/animations/pregnant_woman.png')
    print("Saved src/assets/animations/pregnant_woman.png")

    print("Generating Pregnant Woman portrait (89x130)...")
    portrait = build_npc_portrait()
    portrait.save('src/assets/npcs/pregnant_woman.png')
    print("Saved src/assets/npcs/pregnant_woman.png")
