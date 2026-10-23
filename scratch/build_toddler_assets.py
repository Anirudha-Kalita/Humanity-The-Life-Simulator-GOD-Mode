import os
import numpy as np
import scipy.ndimage
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32
REF_HEIGHT = 48.0  # Toddler target height (~48 px)

sheet_path = r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792676671021_25f535ba.jpg'
sheet_img = Image.open(sheet_path)

out_dir = 'scratch/toddler_extracted'
os.makedirs(out_dir, exist_ok=True)
struct = scipy.ndimage.generate_binary_structure(2, 2)

def extract_clean_sprite(crop_box, name):
    crop = sheet_img.crop(crop_box)
    arr = np.array(crop)
    H, W = arr.shape[:2]
    bright = arr.mean(axis=2)
    r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
    is_outline = (r < 65) & (g < 65) & (b < 65)
    sealed = scipy.ndimage.binary_dilation(is_outline, structure=struct, iterations=1)
    traversable = ~sealed & (bright > 185)
    lbl, num = scipy.ndimage.label(traversable)
    seed_mask = np.zeros((H, W), dtype=bool)
    seed_mask[0, :] = True
    seed_mask[-1, :] = True
    seed_mask[:, 0] = True
    seed_mask[:, -1] = True
    border_lbls = set(np.unique(lbl[seed_mask])) - {0}
    bg_mask = np.isin(lbl, list(border_lbls))
    bg_mask = scipy.ndimage.binary_dilation(bg_mask, structure=struct, iterations=1) & ~is_outline
    alpha = (~bg_mask).astype(np.uint8) * 255
    rgba = np.dstack([arr, alpha])
    im_clean = Image.fromarray(rgba, 'RGBA')
    bbox = im_clean.getbbox()
    if bbox:
        cropped = im_clean.crop(bbox)
        cropped.save(f'{out_dir}/{name}.png')
        print(f'{name:20s}: size={cropped.size}')
        return cropped
    return None

print("Extracting toddler sprites from sheet...")
# Row 1: Front View (Right Direction) & Back View (Right Direction)
# y in [45, 130]
extract_clean_sprite((10, 45, 80, 130), 'idle_fr')
extract_clean_sprite((90, 45, 175, 130), 'crawl_fr')
extract_clean_sprite((175, 45, 255, 130), 'crouch_fr')
extract_clean_sprite((255, 45, 335, 130), 'reach_fr')
extract_clean_sprite((335, 45, 415, 130), 'play_ball_fr')
extract_clean_sprite((415, 45, 495, 130), 'happy_fr')

extract_clean_sprite((535, 45, 600, 130), 'idle_br')
extract_clean_sprite((600, 45, 680, 130), 'crawl_br')
extract_clean_sprite((680, 45, 760, 130), 'crouch_br')
extract_clean_sprite((760, 45, 840, 130), 'reach_br')
extract_clean_sprite((840, 45, 920, 130), 'play_ball_br')
extract_clean_sprite((920, 45, 1000, 130), 'happy_br')

# Row 2: Left View (Left Direction) & Back View (Left Direction)
# y in [190, 275]
extract_clean_sprite((10, 190, 80, 275), 'idle_fl')
extract_clean_sprite((80, 190, 175, 275), 'crawl_fl')
extract_clean_sprite((175, 190, 255, 275), 'crouch_fl')
extract_clean_sprite((255, 190, 335, 275), 'reach_fl')
extract_clean_sprite((335, 190, 415, 275), 'play_ball_fl')
extract_clean_sprite((415, 190, 495, 275), 'happy_fl')

extract_clean_sprite((535, 190, 600, 275), 'idle_bl')
extract_clean_sprite((600, 190, 680, 275), 'crawl_bl')
extract_clean_sprite((680, 190, 760, 275), 'crouch_bl')
extract_clean_sprite((760, 190, 840, 275), 'reach_bl')
extract_clean_sprite((840, 190, 920, 275), 'play_ball_bl')
extract_clean_sprite((920, 190, 1000, 275), 'happy_bl')

# Row 3: Crawling & Crouching
# y in [340, 420]
extract_clean_sprite((15, 340, 130, 420), 'crawl_front')
extract_clean_sprite((135, 340, 250, 420), 'crawl_back')
extract_clean_sprite((255, 340, 370, 420), 'crawl_left')
extract_clean_sprite((375, 340, 490, 420), 'crawl_right')

extract_clean_sprite((525, 340, 640, 420), 'crouch_front')
extract_clean_sprite((645, 340, 760, 420), 'crouch_back')
extract_clean_sprite((765, 340, 880, 420), 'crouch_left')
extract_clean_sprite((885, 340, 1000, 420), 'crouch_right')

# Row 4: Activities
# y in [455, 540]
extract_clean_sprite((15, 455, 110, 540), 'support_left')
extract_clean_sprite((110, 455, 205, 540), 'support_right')
extract_clean_sprite((215, 455, 310, 540), 'playing_rings')
extract_clean_sprite((315, 455, 415, 540), 'playing_car')
extract_clean_sprite((425, 455, 520, 540), 'eating_front')
extract_clean_sprite((520, 455, 610, 540), 'eating_right')
extract_clean_sprite((615, 455, 710, 540), 'drinking_front')
extract_clean_sprite((710, 455, 795, 540), 'drinking_right')
extract_clean_sprite((800, 455, 905, 540), 'sleeping_front')
extract_clean_sprite((905, 455, 1010, 540), 'sleeping_right')

# Row 5: Emotes and Reactions
# y in [575, 655]
extract_clean_sprite((10, 575, 85, 655), 'looking_up')
extract_clean_sprite((85, 575, 160, 655), 'looking_down')
extract_clean_sprite((160, 575, 235, 655), 'surprised')
extract_clean_sprite((235, 575, 315, 655), 'happy')
extract_clean_sprite((315, 575, 385, 655), 'sad')
extract_clean_sprite((385, 575, 455, 655), 'angry')
extract_clean_sprite((455, 575, 525, 655), 'shy')
extract_clean_sprite((525, 575, 600, 655), 'clapping')
extract_clean_sprite((600, 575, 675, 655), 'waving')
extract_clean_sprite((675, 575, 755, 655), 'with_toy')
extract_clean_sprite((755, 575, 850, 655), 'with_parent')
extract_clean_sprite((850, 575, 925, 655), 'crying')
extract_clean_sprite((925, 575, 1005, 655), 'bending_down')

def load_pose(name):
    return Image.open(f'{out_dir}/{name}.png')

def make_toddler_sprite(name_or_img, max_h=REF_HEIGHT, max_w=58.0, flip_h=False):
    src = load_pose(name_or_img) if isinstance(name_or_img, str) else name_or_img
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

def draw_zzz(canvas, frame_idx):
    draw = ImageDraw.Draw(canvas)
    color = (226, 232, 240, 240)
    shadow = (30, 41, 59, 180)
    offsets = [
        (40, 32 - frame_idx * 2, 'z'),
        (44, 25 - frame_idx * 2, 'z'),
        (49, 18 - frame_idx * 2, 'Z'),
    ]
    for ox, oy, letter in offsets:
        if oy > 1:
            draw.text((ox + 1, oy + 1), letter, fill=shadow)
            draw.text((ox, oy), letter, fill=color)

def draw_toddler_sparkle(canvas, frame_idx):
    draw = ImageDraw.Draw(canvas)
    sx = 50
    sy = 24 + (frame_idx % 2) * -1
    sparkle_color = (255, 235, 180, 230)
    draw.point((sx, sy), fill=sparkle_color)
    draw.point((sx - 1, sy), fill=(255, 200, 120, 160))
    draw.point((sx + 1, sy), fill=(255, 200, 120, 160))
    draw.point((sx, sy - 1), fill=(255, 200, 120, 160))
    draw.point((sx, sy + 1), fill=(255, 200, 120, 160))

def build_atlas():
    atlas = Image.new('RGBA', (CELL_W * 4, CELL_H * 18), (0, 0, 0, 0))

    # Crawling Sprites (Toddler only crawls on hands & knees)
    sp_crawl_front_0 = make_toddler_sprite('crawl_front', max_h=42.0, flip_h=False)
    sp_crawl_front_2 = make_toddler_sprite('crawl_front', max_h=42.0, flip_h=True)

    sp_crawl_back_0 = make_toddler_sprite('crawl_back', max_h=42.0, flip_h=False)
    sp_crawl_back_2 = make_toddler_sprite('crawl_back', max_h=42.0, flip_h=True)

    # Crawl Left: MUST face strictly LEFT (flip_h=True so head/hands are on left, rump/feet on right)
    sp_crawl_left_0 = make_toddler_sprite('crawl_right', max_h=42.0, flip_h=True)
    sp_crawl_left_1 = make_toddler_sprite('crawl_left', max_h=42.0, flip_h=True)

    # Crawl Right: MUST face strictly RIGHT (head/hands on right, rump/feet on left)
    sp_crawl_right_0 = make_toddler_sprite('crawl_right', max_h=42.0, flip_h=False)
    sp_crawl_right_1 = make_toddler_sprite('crawl_left', max_h=42.0, flip_h=False)

    # Crouching / Sitting Idles (low on floor, cute toddler posture)
    sp_crouch_front = make_toddler_sprite('crouch_front', max_h=44.0, flip_h=False)
    sp_crouch_back = make_toddler_sprite('crouch_back', max_h=44.0, flip_h=False)
    sp_crouch_left = make_toddler_sprite('crouch_right', max_h=44.0, flip_h=True)   # strictly faces LEFT
    sp_crouch_right = make_toddler_sprite('crouch_right', max_h=44.0, flip_h=False) # strictly faces RIGHT

    # Actions
    sp_rings = make_toddler_sprite('playing_rings', max_h=46.0)
    sp_car = make_toddler_sprite('playing_car', max_h=46.0)
    sp_sleep = make_toddler_sprite('sleeping_front', max_h=42.0)
    sp_eat = make_toddler_sprite('eating_front', max_h=46.0)
    sp_drink = make_toddler_sprite('drinking_front', max_h=46.0)
    sp_tantrum = make_toddler_sprite('crying', max_h=48.0)
    sp_angry = make_toddler_sprite('angry', max_h=48.0)
    sp_toy = make_toddler_sprite('with_toy', max_h=48.0)
    sp_happy = make_toddler_sprite('happy', max_h=48.0)
    sp_clapping = make_toddler_sprite('clapping', max_h=48.0)
    sp_parent = make_toddler_sprite('with_parent', max_h=48.0)
    sp_support = make_toddler_sprite('support_left', max_h=48.0)

    # Row 0: walkDown (4 frames) - Hands-and-knees Crawl Down (Front)
    w_down_frames = [sp_crawl_front_0, sp_crawl_front_0, sp_crawl_front_2, sp_crawl_front_2]
    w_down_dx = [-1, 0, 1, 0]
    w_down_dy = [0, -1, 0, -1]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        place_sprite(cell, w_down_frames[f], cx=32, by=BASELINE_Y, dx=w_down_dx[f], dy=w_down_dy[f])
        atlas.paste(cell, (f * CELL_W, 0 * CELL_H))

    # Row 1: walkLeft (4 frames) - Hands-and-knees Crawl Left (faces strictly LEFT)
    w_left_frames = [sp_crawl_left_0, sp_crawl_left_1, sp_crawl_left_0, sp_crawl_left_1]
    w_left_dx = [0, -1, 0, -1]
    w_left_dy = [0, -1, 0, -1]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        place_sprite(cell, w_left_frames[f], cx=32, by=BASELINE_Y, dx=w_left_dx[f], dy=w_left_dy[f])
        atlas.paste(cell, (f * CELL_W, 1 * CELL_H))

    # Row 2: walkUp (4 frames) - Hands-and-knees Crawl Up (Back view)
    w_up_frames = [sp_crawl_back_0, sp_crawl_back_0, sp_crawl_back_2, sp_crawl_back_2]
    w_up_dx = [-1, 0, 1, 0]
    w_up_dy = [0, -1, 0, -1]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        place_sprite(cell, w_up_frames[f], cx=32, by=BASELINE_Y, dx=w_up_dx[f], dy=w_up_dy[f])
        atlas.paste(cell, (f * CELL_W, 2 * CELL_H))

    # Row 3: walkRight (4 frames) - Hands-and-knees Crawl Right (faces strictly RIGHT)
    w_right_frames = [sp_crawl_right_0, sp_crawl_right_1, sp_crawl_right_0, sp_crawl_right_1]
    w_right_dx = [0, 1, 0, 1]
    w_right_dy = [0, -1, 0, -1]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        place_sprite(cell, w_right_frames[f], cx=32, by=BASELINE_Y, dx=w_right_dx[f], dy=w_right_dy[f])
        atlas.paste(cell, (f * CELL_W, 3 * CELL_H))

    # Row 4: idleDown (4 frames) - Front crouching idle with breathing
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_crouch_front, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 4 * CELL_H))

    # Row 5: idleLeft (4 frames) - Left crouching idle with breathing (faces strictly LEFT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_crouch_left, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 5 * CELL_H))

    # Row 6: idleUp (4 frames) - Back crouching idle with breathing (faces BACK)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_crouch_back, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 6 * CELL_H))

    # Row 7: idleRight (4 frames) - Right crouching idle with breathing (faces strictly RIGHT)
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_crouch_right, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 7 * CELL_H))

    # Row 8: sit (4 frames) - Sitting on floor stacking rings
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_rings, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 8 * CELL_H))

    # Row 9: sleep (4 frames) - Sleeping tucked in bed with Zzz
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, 0, -1, 0][f]
        place_sprite(cell, sp_sleep, cx=32, by=BASELINE_Y, dy=dy)
        draw_zzz(cell, f)
        atlas.paste(cell, (f * CELL_W, 9 * CELL_H))

    # Row 10: eat (4 frames) - Eating cereal bowl & sippy cup
    eat_frames = [sp_eat, sp_drink, sp_eat, sp_drink]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, eat_frames[f], cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 10 * CELL_H))

    # Row 11: fight / tantrum (4 frames) - Crying / stomping tantrum
    tantrum_frames = [sp_tantrum, sp_angry, sp_tantrum, sp_angry]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, 1][f]
        place_sprite(cell, tantrum_frames[f], cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 11 * CELL_H))

    # Row 12: carry (4 frames) - Carrying / cuddling teddy bear
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_toy, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 12 * CELL_H))

    # Row 13: emote (4 frames) - Cheerful celebration / clapping
    emote_frames = [sp_happy, sp_clapping, sp_happy, sp_clapping]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, emote_frames[f], cx=32, by=BASELINE_Y, dy=dy)
        draw_toddler_sparkle(cell, f)
        atlas.paste(cell, (f * CELL_W, 13 * CELL_H))

    # Row 14: read / car (4 frames) - Playing with red toy car
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, -1, 0][f]
        place_sprite(cell, sp_car, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 14 * CELL_H))

    # Row 15: work / crawl (4 frames) - Crawling around exploring
    crawl_frames = [sp_crawl_front_0, sp_crawl_right_0, sp_crawl_front_2, sp_crawl_left_0]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, crawl_frames[f], cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 15 * CELL_H))

    # Row 16: craft / blocks (4 frames) - Building block tower
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, -1][f]
        place_sprite(cell, sp_rings, cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 16 * CELL_H))

    # Row 17: staticWork / parent (4 frames) - Standing holding onto parent / support
    parent_frames = [sp_parent, sp_support, sp_parent, sp_support]
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        dy = [0, -1, 0, 1][f]
        place_sprite(cell, parent_frames[f], cx=32, by=BASELINE_Y, dy=dy)
        atlas.paste(cell, (f * CELL_W, 17 * CELL_H))

    return atlas

def build_portrait():
    src = load_pose('idle_fr')
    target_h = 130
    target_w = int(round(src.width * target_h / src.height))
    resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (89, 130), (0, 0, 0, 0))
    paste_x = (89 - target_w) // 2
    portrait.paste(resized, (paste_x, 0), resized)
    return portrait

if __name__ == '__main__':
    print("Building Toddler animation atlas (256x1440)...")
    atlas = build_atlas()
    atlas.save('src/assets/animations/child_toddler.png')
    atlas.save('src/assets/animations/toddler.png')
    print("Saved src/assets/animations/child_toddler.png & toddler.png")

    print("Building Toddler portrait (89x130)...")
    portrait = build_portrait()
    portrait.save('src/assets/npcs/child_toddler.png')
    portrait.save('src/assets/npcs/toddler.png')
    print("Saved src/assets/npcs/child_toddler.png & toddler.png")
