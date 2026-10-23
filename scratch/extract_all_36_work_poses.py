import os
import numpy as np
import scipy.ndimage
from PIL import Image

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

rows_meta = [
    {
        "role": "elder",
        "name": "Elderly Man",
        "y_range": (10, 100),
        "poses": ["watering_plants", "planting_seeds", "weeding", "checking_crops", "carrying_harvest", "taking_rest"]
    },
    {
        "role": "forager",
        "name": "Young Woman (Forager/Cook)",
        "y_range": (124, 215),
        "poses": ["preparing_food", "stirring_pot", "serving_food", "cleaning", "washing_dishes", "taking_break"]
    },
    {
        "role": "guard",
        "name": "Guard",
        "y_range": (238, 332),
        "poses": ["standing_guard", "walking_patrol", "checking_area", "interacting", "at_post", "resting"]
    },
    {
        "role": "lumberjack",
        "name": "Lumberjack",
        "y_range": (352, 441),
        "poses": ["chopping_wood", "collecting_logs", "stacking_wood", "carrying_wood", "sharpening_axe", "taking_break"]
    },
    {
        "role": "child_girl",
        "name": "Farmer Girl",
        "y_range": (466, 560),
        "poses": ["watering_crops", "planting_seeds", "harvesting", "carrying_harvest", "feeding_animals", "resting"]
    },
    {
        "role": "healer",
        "name": "Wizard / Healer",
        "y_range": (578, 652),
        "poses": ["casting_heal", "casting_buff", "supporting", "reading_spellbook", "healing_injured", "resting"]
    }
]

col_splits = [200, 330, 475, 610, 735, 870, 1015]
os.makedirs('scratch/work_poses', exist_ok=True)

all_extracted = []

for r_idx, r_meta in enumerate(rows_meta):
    role = r_meta['role']
    y0, y1 = r_meta['y_range']
    print(f"\nRow {r_idx}: {r_meta['name']} (y={y0}..{y1})")
    
    row_patch = arr[y0:y1, :]
    
    for c_idx in range(6):
        x0 = col_splits[c_idx]
        x1 = col_splits[c_idx + 1]
        pose_name = r_meta['poses'][c_idx]
        
        cell = row_patch[:, x0:x1]
        bright = cell.mean(axis=2)
        dark_outline = (bright < 95)
        # Background is bright (> 170) and not an outline
        traversable = (bright > 175) & (~dark_outline)

        lbl, num = scipy.ndimage.label(traversable)
        bg_seed = np.zeros(cell.shape[:2], dtype=bool)
        bg_seed[0, :] = True
        bg_seed[-1, :] = True
        bg_seed[:, 0] = True
        bg_seed[:, -1] = True

        border_labels = set(np.unique(lbl[bg_seed])) - {0}
        bg_mask = np.isin(lbl, list(border_labels))

        # Also fill small enclosed background holes
        for l in range(1, num + 1):
            if l not in border_labels:
                ys, xs = np.where(lbl == l)
                if len(ys) >= 15 and np.mean(bright[ys, xs]) > 215:
                    bg_mask[ys, xs] = True

        alpha = (~bg_mask).astype(np.uint8) * 255
        rgba = np.dstack([cell, alpha])
        im_cell = Image.fromarray(rgba, 'RGBA')
        bbox = im_cell.getbbox()
        if bbox:
            cropped = im_cell.crop(bbox)
            fname = f"scratch/work_poses/{role}_{c_idx}_{pose_name}.png"
            cropped.save(fname)
            all_extracted.append((role, c_idx, pose_name, cropped.size, bbox))
            print(f"  Col {c_idx} ({pose_name:18s}): size={cropped.size}, bbox={bbox}")
        else:
            print(f"  Col {c_idx} ({pose_name:18s}): EMPTY!")

print(f"\nTotal poses extracted: {len(all_extracted)} / 36")
