import os
from PIL import Image, ImageDraw

CELL_W = 64
CELL_H = 80
BASELINE_Y = 76
CENTER_X = 32

work_dir = 'scratch/work_poses'

def place_scaled_work_pose(cell, im_name, cx=CENTER_X, by=BASELINE_Y, dy=0, max_w=58.0, max_h=66.0, flip_h=False):
    src = Image.open(f"{work_dir}/{im_name}")
    w, h = src.size
    scale = min(max_h / h, max_w / w, 0.78)
    tw = max(1, int(round(w * scale)))
    th = max(1, int(round(h * scale)))
    resized = src.resize((tw, th), Image.Resampling.LANCZOS)
    if flip_h:
        resized = resized.transpose(Image.FLIP_LEFT_RIGHT)
    x = int(round(cx - tw / 2.0))
    y = int(round(by - th + dy))
    cell.paste(resized, (x, y), resized)

def update_row_4f(atlas, row_idx, make_frame_fn):
    for f in range(4):
        cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        make_frame_fn(cell, f)
        atlas.paste(cell, (f * CELL_W, row_idx * CELL_H))

# =========================================================================
# 1. ELDERLY MAN
# =========================================================================
print("Updating Elderly Man atlas with field work poses...")
atlas_elder = Image.open('src/assets/animations/elderly_man.png')

# Row 8: sit -> taking_rest (seated on tree stump with cane)
update_row_4f(atlas_elder, 8, lambda cell, f: place_scaled_work_pose(cell, 'elder_5_taking_rest.png', dy=[0, -1, -1, 0][f]))

# Row 12: carry -> carrying_harvest (carrying crate of vegetables)
update_row_4f(atlas_elder, 12, lambda cell, f: place_scaled_work_pose(cell, 'elder_4_carrying_harvest.png', dy=[0, -1, 0, -1][f]))

# Row 15: work -> checking_crops (checking crops with walking cane)
update_row_4f(atlas_elder, 15, lambda cell, f: place_scaled_work_pose(cell, 'elder_3_checking_crops.png', dy=[0, -1, -1, 0][f]))

# Row 16: craft -> planting_seeds & weeding (kneeling farming work)
def make_elder_craft(cell, f):
    im = 'elder_1_planting_seeds.png' if f < 2 else 'elder_2_weeding.png'
    place_scaled_work_pose(cell, im, dy=[0, -1, 0, -1][f])
update_row_4f(atlas_elder, 16, make_elder_craft)

# Row 17: staticWork -> watering_plants (watering can poured onto crop sprout)
def make_elder_water(cell, f):
    place_scaled_work_pose(cell, 'elder_0_watering_plants.png', dy=[0, -1, 0, 1][f])
update_row_4f(atlas_elder, 17, make_elder_water)

atlas_elder.save('src/assets/animations/elderly_man.png')
print("Saved elderly_man.png with farming work poses!")


# =========================================================================
# 2. LUMBERJACK & WOODCUTTER
# =========================================================================
print("Updating Lumberjack/Woodcutter atlas with woodcutting field poses...")
atlas_lumber = Image.open('src/assets/animations/lumberjack.png')

# Row 8: sit -> taking_break (seated on timber log drinking)
update_row_4f(atlas_lumber, 8, lambda cell, f: place_scaled_work_pose(cell, 'lumberjack_5_taking_break.png', dy=[0, -1, -1, 0][f]))

# Row 12: carry -> collecting_logs (shoulder) & carrying_wood (back bundle)
def make_lumber_carry(cell, f):
    im = 'lumberjack_1_collecting_logs.png' if f < 2 else 'lumberjack_3_carrying_wood.png'
    place_scaled_work_pose(cell, im, dy=[0, -1, 0, -1][f])
update_row_4f(atlas_lumber, 12, make_lumber_carry)

# Row 15: work -> collecting_logs / checking timber
update_row_4f(atlas_lumber, 15, lambda cell, f: place_scaled_work_pose(cell, 'lumberjack_1_collecting_logs.png', dy=[0, -1, 0, -1][f]))

# Row 16: craft -> stacking_wood & sharpening_axe on grinding stump
def make_lumber_craft(cell, f):
    im = 'lumberjack_2_stacking_wood.png' if f < 2 else 'lumberjack_4_sharpening_axe.png'
    place_scaled_work_pose(cell, im, dy=[0, -1, 0, -1][f])
update_row_4f(atlas_lumber, 16, make_lumber_craft)

# Row 17: staticWork -> chopping_wood (chopping timber log with axe!)
def make_lumber_chop(cell, f):
    place_scaled_work_pose(cell, 'lumberjack_0_chopping_wood.png', dy=[0, -1, 1, 0][f])
    # Blade strike spark on frame 2
    if f == 2:
        draw = ImageDraw.Draw(cell)
        draw.arc([42, 34, 62, 58], start=280, end=70, fill=(254, 240, 138, 240), width=2)
        draw.point((58, 42), fill=(255, 255, 255, 255))
        draw.rectangle([54, 30, 56, 32], fill=(180, 83, 9, 230))
update_row_4f(atlas_lumber, 17, make_lumber_chop)

atlas_lumber.save('src/assets/animations/lumberjack.png')
atlas_lumber.save('src/assets/animations/woodcutter.png')
print("Saved lumberjack.png and woodcutter.png with timber work poses!")


# =========================================================================
# 3. WIZARD / HEALER
# =========================================================================
print("Updating Healer atlas with magic healing and support field poses...")
atlas_healer = Image.open('src/assets/animations/healer.png')

# Row 8: sit -> resting (seated resting with healing staff)
update_row_4f(atlas_healer, 8, lambda cell, f: place_scaled_work_pose(cell, 'healer_5_resting.png', dy=[0, -1, -1, 0][f]))

# Row 14: read -> reading_spellbook (reading glowing floating spellbook / scroll)
update_row_4f(atlas_healer, 14, lambda cell, f: place_scaled_work_pose(cell, 'healer_3_reading_spellbook.png', dy=[0, -1, -1, 0][f]))

# Row 15: work -> casting_buff & supporting with staff
def make_healer_buff(cell, f):
    im = 'healer_1_casting_buff.png' if f < 2 else 'healer_2_supporting.png'
    place_scaled_work_pose(cell, im, dy=[0, -1, 0, -1][f])
update_row_4f(atlas_healer, 15, make_healer_buff)

# Row 16: craft -> supporting / channeling protective wards
update_row_4f(atlas_healer, 16, lambda cell, f: place_scaled_work_pose(cell, 'healer_2_supporting.png', dy=[0, -1, 0, -1][f]))

# Row 17: staticWork -> casting_heal & healing_injured (restoring injured settler on bedroll)
def make_healer_heal(cell, f):
    im = 'healer_0_casting_heal.png' if (f % 2 == 0) else 'healer_4_healing_injured.png'
    place_scaled_work_pose(cell, im, dy=[0, -1, 0, -1][f])
update_row_4f(atlas_healer, 17, make_healer_heal)

atlas_healer.save('src/assets/animations/healer.png')
print("Saved healer.png with magic healing field poses!")


# =========================================================================
# 4. GUARD / HUNTER
# =========================================================================
print("Updating Guard/Hunter atlas with guard watch and patrol field poses...")
atlas_guard = Image.open('src/assets/animations/guard.png')

# Row 8: sit -> resting (seated resting on bench with spear)
update_row_4f(atlas_guard, 8, lambda cell, f: place_scaled_work_pose(cell, 'guard_5_resting.png', dy=[0, -1, -1, 0][f]))

# Row 12: carry -> walking_patrol (patrolling with spear)
update_row_4f(atlas_guard, 12, lambda cell, f: place_scaled_work_pose(cell, 'guard_1_walking_patrol.png', dy=[0, -1, 0, -1][f]))

# Row 13: emote -> interacting (friendly waving / greeting hand)
update_row_4f(atlas_guard, 13, lambda cell, f: place_scaled_work_pose(cell, 'guard_3_interacting.png', dy=[0, -1, -1, 0][f]))

# Row 15: work -> checking_area (hand shielding eyes scouting ahead)
update_row_4f(atlas_guard, 15, lambda cell, f: place_scaled_work_pose(cell, 'guard_2_checking_area.png', dy=[0, -1, 0, -1][f]))

# Row 16: craft / sentry -> at_post (standing watch at sentry post / hut)
update_row_4f(atlas_guard, 16, lambda cell, f: place_scaled_work_pose(cell, 'guard_4_at_post.png', dy=[0, -1, -1, 0][f]))

# Row 17: staticWork -> standing_guard (standing alert with spear)
update_row_4f(atlas_guard, 17, lambda cell, f: place_scaled_work_pose(cell, 'guard_0_standing_guard.png', dy=[0, -1, 0, -1][f]))

atlas_guard.save('src/assets/animations/guard.png')
atlas_guard.save('src/assets/animations/hunter.png')
print("Saved guard.png and hunter.png with guard watch field poses!")


# =========================================================================
# 5. FORAGER / COOK (Young Woman)
# =========================================================================
print("Updating Cook/Forager atlas with kitchen and cooking field poses...")
atlas_cook = Image.open('src/assets/animations/cook.png')

# Row 8: sit -> taking_break (seated on bench with basket)
update_row_4f(atlas_cook, 8, lambda cell, f: place_scaled_work_pose(cell, 'forager_5_taking_break.png', dy=[0, -1, -1, 0][f]))

# Row 10: eat -> serving_food (serving hot steaming bowl of stew)
update_row_4f(atlas_cook, 10, lambda cell, f: place_scaled_work_pose(cell, 'forager_2_serving_food.png', dy=[0, -1, 0, -1][f]))

# Row 15: work -> cleaning (sweeping with broom)
update_row_4f(atlas_cook, 15, lambda cell, f: place_scaled_work_pose(cell, 'forager_3_cleaning.png', dy=[0, -1, 0, -1][f]))

# Row 16: craft -> preparing_food & washing_dishes (chopping at table & washing dishes at basin)
def make_cook_craft(cell, f):
    im = 'forager_0_preparing_food.png' if f < 2 else 'forager_4_washing_dishes.png'
    place_scaled_work_pose(cell, im, dy=[0, -1, 0, -1][f])
update_row_4f(atlas_cook, 16, make_cook_craft)

# Row 17: staticWork -> stirring_pot (stirring boiling pot on fire stove with steam)
update_row_4f(atlas_cook, 17, lambda cell, f: place_scaled_work_pose(cell, 'forager_1_stirring_pot.png', dy=[0, -1, 0, 1][f]))

atlas_cook.save('src/assets/animations/cook.png')
atlas_cook.save('src/assets/animations/baker.png')
atlas_cook.save('src/assets/animations/female_farmer.png')
atlas_cook.save('src/assets/animations/forager.png')
print("Saved cook.png, baker.png, female_farmer.png, forager.png with kitchen field poses!")


# =========================================================================
# 6. FARMER GIRL (Child Girl)
# =========================================================================
print("Updating Child Girl atlas with farming and harvesting field poses...")
atlas_girl = Image.open('src/assets/animations/child_girl.png')

# Row 8: sit -> resting (seated on crate with harvest basket)
update_row_4f(atlas_girl, 8, lambda cell, f: place_scaled_work_pose(cell, 'child_girl_5_resting.png', dy=[0, -1, -1, 0][f]))

# Row 12: carry -> carrying_harvest (carrying heavy harvest crate of vegetables)
update_row_4f(atlas_girl, 12, lambda cell, f: place_scaled_work_pose(cell, 'child_girl_3_carrying_harvest.png', dy=[0, -1, 0, -1][f]))

# Row 15: work -> harvesting & feeding_animals (picking vegetables & feeding the chicken)
def make_girl_work(cell, f):
    im = 'child_girl_2_harvesting.png' if f < 2 else 'child_girl_4_feeding_animals.png'
    place_scaled_work_pose(cell, im, dy=[0, -1, 0, -1][f])
update_row_4f(atlas_girl, 15, make_girl_work)

# Row 16: craft -> planting_seeds (kneeling planting seeds in soil)
update_row_4f(atlas_girl, 16, lambda cell, f: place_scaled_work_pose(cell, 'child_girl_1_planting_seeds.png', dy=[0, -1, 0, -1][f]))

# Row 17: staticWork -> watering_crops (watering crops with little watering can)
update_row_4f(atlas_girl, 17, lambda cell, f: place_scaled_work_pose(cell, 'child_girl_0_watering_crops.png', dy=[0, -1, 0, 1][f]))

atlas_girl.save('src/assets/animations/child_girl.png')
print("Saved child_girl.png with farming and harvesting field poses!")
