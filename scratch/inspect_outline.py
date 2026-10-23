from PIL import Image
import numpy as np

im = Image.open('scratch/test_walking_crop.png')
arr = np.array(im)
H, W = arr.shape[:2]

r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
bright = (r + g + b) // 3

# Dark outlines are < 80
outline = (bright < 80)
print(f"Outline pixels count: {np.count_nonzero(outline)}")

# Let's inspect rows to see the character silhouette:
for y in range(0, H, 10):
    xs = np.where(outline[y, :])[0]
    if len(xs) > 0:
        print(f"y={y:3d}: x_min={xs.min():3d}, x_max={xs.max():3d}, width={xs.max()-xs.min():3d}")
