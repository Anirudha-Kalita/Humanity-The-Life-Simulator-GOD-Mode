import os
import numpy as np
import scipy.ndimage
from PIL import Image

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

# 6 rows:
rows_meta = [
    {
        "role": "elder",
        "name": "Elderly Man",
        "y_range": (10, 100),
        "bg_sample": (15, 215), # Y, X
        "poses": ["watering_plants", "planting_seeds", "weeding", "checking_crops", "carrying_harvest", "taking_rest"]
    },
    {
        "role": "forager_cook",
        "name": "Young Woman",
        "y_range": (124, 215),
        "bg_sample": (130, 215),
        "poses": ["preparing_food", "stirring_pot", "serving_food", "cleaning", "washing_dishes", "taking_break"]
    },
    {
        "role": "guard",
        "name": "Guard",
        "y_range": (238, 332),
        "bg_sample": (245, 215),
        "poses": ["standing_guard", "walking_patrol", "checking_area", "interacting", "at_post", "resting"]
    },
    {
        "role": "lumberjack",
        "name": "Lumberjack",
        "y_range": (352, 441),
        "bg_sample": (360, 215),
        "poses": ["chopping_wood", "collecting_logs", "stacking_wood", "carrying_wood", "sharpening_axe", "taking_break"]
    },
    {
        "role": "child_girl",
        "name": "Farmer Girl",
        "y_range": (466, 560),
        "bg_sample": (475, 215),
        "poses": ["watering_crops", "planting_seeds", "harvesting", "carrying_harvest", "feeding_animals", "resting"]
    },
    {
        "role": "healer",
        "name": "Wizard / Healer",
        "y_range": (578, 652),
        "bg_sample": (585, 215),
        "poses": ["casting_heal", "casting_buff", "supporting", "reading_spellbook", "healing_injured", "resting"]
    }
]

# Column splits:
# Label ends at 200
# 6 poses:
# Col 0: 200..330
# Col 1: 330..475
# Col 2: 475..610
# Col 3: 610..735
# Col 4: 735..870
# Col 5: 870..1015
col_splits = [200, 330, 475, 610, 735, 870, 1015]

os.makedirs('scratch/work_poses', exist_ok=True)

for r_idx, r_meta in enumerate(rows_meta):
    role = r_meta['role']
    y0, y1 = r_meta['y_range']
    sy, sx = r_meta['bg_sample']
    bg_color = arr[sy, sx].astype(float)
    print(f"\nRow {r_idx}: {r_meta['name']} (y={y0}..{y1}), bg_sample={bg_color.astype(int)}")
    
    row_patch = arr[y0:y1, :]
    # Background distance
    diff = np.abs(row_patch.astype(float) - bg_color).max(axis=2)
    # Background mask (flood-fill from edges of each column patch)
    
    for c_idx in range(6):
        x0 = col_splits[c_idx]
        x1 = col_splits[c_idx + 1]
        pose_name = r_meta['poses'][c_idx]
        
        cell_patch = row_patch[:, x0:x1]
        cell_diff = diff[:, x0:x1]
        
        # bg candidate: difference from bg color is small (< 12)
        is_bg = cell_diff < 14
        lbl, num = scipy.ndimage.label(is_bg)
        # Connected to outer edge of cell
        edge_labels = set(np.unique(lbl[0, :])).union(
            np.unique(lbl[-1, :]),
            np.unique(lbl[:, 0]),
            np.unique(lbl[:, -1])
        ) - {0}
        bg_mask = np.isin(lbl, list(edge_labels))
        
        alpha = (~bg_mask).astype(np.uint8) * 255
        rgba = np.dstack([cell_patch, alpha])
        im_cell = Image.fromarray(rgba, 'RGBA')
        bbox = im_cell.getbbox()
        if bbox:
            cropped = im_cell.crop(bbox)
            fname = f"scratch/work_poses/{role}_{c_idx}_{pose_name}.png"
            cropped.save(fname)
            print(f"  Col {c_idx} ({pose_name:18s}): size={cropped.size}, bbox={bbox}")
