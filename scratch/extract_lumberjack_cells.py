import os
import numpy as np
import scipy.ndimage
from PIL import Image

img_path = r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792665990128_a45de65b.jpg'
img = Image.open(img_path)
arr = np.array(img)
H, W = arr.shape[:2]

r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
max_dev = np.maximum(np.maximum(np.abs(r-g), np.abs(r-b)), np.abs(g-b))
brightness = (r + g + b) // 3

# Background checkerboard is neutral and very bright (>= 225, dev <= 8)
is_bg_candidate = (max_dev < 10) & (brightness > 215)

# Connected components of bg candidate starting from edges
lbl, num = scipy.ndimage.label(is_bg_candidate)
edge_labels = set(np.unique(lbl[0, :])).union(
    np.unique(lbl[-1, :]),
    np.unique(lbl[:, 0]),
    np.unique(lbl[:, -1])
) - {0}
bg_mask = np.isin(lbl, list(edge_labels))

# Enclosed holes in background between characters or legs (arms/legs/axe gaps)
for l in range(1, num + 1):
    if l not in edge_labels:
        ys, xs = np.where(lbl == l)
        # If it's a hole of checkerboard surrounded by character
        if len(ys) >= 15 and np.mean(brightness[ys, xs]) > 225 and np.mean(max_dev[ys, xs]) < 6:
            bg_mask[ys, xs] = True

alpha = (~bg_mask).astype(np.uint8) * 255
rgba = np.dstack([arr, alpha])

out_dir = 'scratch/lumberjack_cells'
os.makedirs(out_dir, exist_ok=True)

rows = [
    (0, (25, 228), 4, ['front_idle', 'left_idle', 'right_idle', 'back_idle']),
    (1, (255, 460), 4, ['front_walk', 'left_walk', 'right_walk', 'back_walk']),
    (2, (485, 689), 5, ['sitting', 'resting', 'loving', 'angry', 'surprised']),
    (3, (715, 905), 5, ['fight_punch', 'fight_kick', 'axe_attack', 'axe_defend', 'tired'])
]

extracted = []
for r_idx, (y0, y1), num_cols, names in rows:
    col_w = W / num_cols
    for c_idx in range(num_cols):
        x0 = int(round(c_idx * col_w))
        x1 = int(round((c_idx + 1) * col_w))
        cell_rgba = rgba[y0:y1, x0:x1]
        im_cell = Image.fromarray(cell_rgba, 'RGBA')
        bbox = im_cell.getbbox()
        if bbox:
            cropped = im_cell.crop(bbox)
            name = names[c_idx]
            fname = f"{out_dir}/{r_idx}_{c_idx}_{name}.png"
            cropped.save(fname)
            extracted.append((r_idx, c_idx, name, cropped.size))
            print(f"Row {r_idx} Col {c_idx} ({name:12s}): bbox={bbox}, size={cropped.size}")

print(f"\nTotal cells extracted: {len(extracted)}")
