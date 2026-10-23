import os
import numpy as np
import scipy.ndimage
from PIL import Image

cards_info = [
    # (filename, approx_crop_box (x0, y0, x1, y1), pose_name)
    ("2_0_walking.png", (35, 8, 140, 138), "walking"),
    ("1_2_drinking_water.png", (50, 8, 155, 138), "drinking_water"),
    ("0_1_cleaning.png", (45, 8, 155, 138), "cleaning"),
    ("1_0_shopping.png", (45, 8, 150, 138), "shopping"),
    ("2_2_relaxing.png", (50, 15, 155, 138), "relaxing"),
    ("0_4_resting.png", (40, 10, 160, 138), "resting"),
    ("1_4_reading.png", (45, 12, 155, 138), "reading"),
    ("0_0_cooking.png", (40, 10, 150, 138), "cooking"),
    ("2_1_preparing_food.png", (40, 10, 150, 138), "preparing_food"),
    ("2_4_with_family.png", (40, 12, 165, 138), "with_family"),
    ("3_2_stretching.png", (50, 15, 155, 138), "stretching"),
    ("3_4_preparing_baby.png", (45, 15, 155, 138), "preparing_baby"),
    ("1_3_gardening.png", (45, 15, 155, 138), "gardening")
]

os.makedirs('scratch/pregnant_poses', exist_ok=True)
struct = scipy.ndimage.generate_binary_structure(2, 2)

for card_file, (x0, y0, x1, y1), pose_name in cards_info:
    im = Image.open(f"scratch/pregnant_cards/{card_file}")
    crop = im.crop((x0, y0, x1, y1))
    arr = np.array(crop)
    H, W = arr.shape[:2]
    bright = arr.mean(axis=2)
    
    # Sealed outline
    is_outline = (bright < 85)
    sealed_outline = scipy.ndimage.binary_dilation(is_outline, structure=struct, iterations=1)
    
    # Flood fill from image borders
    traversable = ~sealed_outline
    lbl, num = scipy.ndimage.label(traversable)
    
    seed_mask = np.zeros((H, W), dtype=bool)
    seed_mask[0, :] = True
    seed_mask[-1, :] = True
    seed_mask[:, 0] = True
    seed_mask[:, -1] = True
    
    border_labels = set(np.unique(lbl[seed_mask])) - {0}
    bg_mask = np.isin(lbl, list(border_labels))
    bg_mask = scipy.ndimage.binary_dilation(bg_mask, structure=struct, iterations=1)
    
    alpha = (~bg_mask).astype(np.uint8) * 255
    rgba = np.dstack([arr, alpha])
    im_out = Image.fromarray(rgba, 'RGBA')
    bbox = im_out.getbbox()
    if bbox:
        cropped = im_out.crop(bbox)
        fname = f"scratch/pregnant_poses/{pose_name}.png"
        cropped.save(fname)
        print(f"{pose_name:18s}: size={cropped.size}, bbox={bbox}")
    else:
        print(f"{pose_name:18s}: EMPTY!")
