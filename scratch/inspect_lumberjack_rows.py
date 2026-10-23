import os
from PIL import Image
import numpy as np
import scipy.ndimage

img_path = r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792665990128_a45de65b.jpg'
img = Image.open(img_path)
arr = np.array(img)
H, W = arr.shape[:2]
print(f"Loaded image: {W}x{H}")

r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
max_dev = np.maximum(np.maximum(np.abs(r-g), np.abs(r-b)), np.abs(g-b))
brightness = (r + g + b) // 3

# Checkerboard pattern is near-grayscale (max_dev < 8) and brightness > 220
# Let's inspect the distribution of brightness and max_dev on corners:
corner = arr[:40, :40]
c_dev = np.maximum(np.maximum(np.abs(corner[:,:,0].astype(int)-corner[:,:,1].astype(int)),
                              np.abs(corner[:,:,0].astype(int)-corner[:,:,2].astype(int))),
                   np.abs(corner[:,:,1].astype(int)-corner[:,:,2].astype(int)))
c_bright = corner.mean(axis=2)
print(f"Corner max_dev max: {c_dev.max()}, min: {c_dev.min()}")
print(f"Corner brightness min: {c_bright.min()}, max: {c_bright.max()}")

# Labels (e.g. "Front (Idle)", "Sitting", etc.) are text at the bottom of each row
# Let's see the Y coordinates of text vs characters.
# In the previous sheets, character rows were approximately:
# Row 0: Y ~ 25 to 226
# Row 1: Y ~ 255 to 455
# Row 2: Y ~ 485 to 685
# Row 3: Y ~ 715 to 895
# Text is beneath each character: e.g. Y in [228, 252], [457, 482], [687, 712], [897, 930]

rows = [
    (0, (25, 230), 4, ['front_idle', 'left_idle', 'right_idle', 'back_idle']),
    (1, (255, 460), 4, ['front_walk', 'left_walk', 'right_walk', 'back_walk']),
    (2, (485, 690), 5, ['sitting', 'resting', 'loving', 'angry', 'surprised']),
    (3, (715, 905), 5, ['fight_punch', 'fight_kick', 'axe_attack', 'axe_defend', 'tired'])
]

# Check characters vertical profiles
for r_idx, (y0, y1), num_cols, names in rows:
    col_w = W / num_cols
    print(f"\n--- Row {r_idx} ({y0} to {y1}) ---")
    for c_idx in range(num_cols):
        x0 = int(round(c_idx * col_w))
        x1 = int(round((c_idx + 1) * col_w))
        patch = arr[y0:y1, x0:x1]
        p_dev = np.maximum(np.maximum(np.abs(patch[:,:,0].astype(int)-patch[:,:,1].astype(int)),
                                      np.abs(patch[:,:,0].astype(int)-patch[:,:,2].astype(int))),
                           np.abs(patch[:,:,1].astype(int)-patch[:,:,2].astype(int)))
        p_bright = (patch[:,:,0].astype(int) + patch[:,:,1].astype(int) + patch[:,:,2].astype(int)) // 3
        non_bg = (p_dev >= 8) | (p_bright < 220)
        ys, xs = np.where(non_bg)
        if len(ys) > 0:
            print(f"  Col {c_idx} ({names[c_idx]}): y_rel=[{ys.min()}, {ys.max()}] (abs y=[{y0+ys.min()}, {y0+ys.max()}]), h={ys.max()-ys.min()+1}, w={xs.max()-xs.min()+1}")
        else:
            print(f"  Col {c_idx} ({names[c_idx]}): empty?")
