from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792672019591_fb8d1b2c.jpg')
arr = np.array(img)
H, W = arr.shape[:2]

# 4 rows, 5 columns
# Inspect horizontal white margins between rows
for y in range(0, H, 10):
    row_pixels = arr[y, :, :]
    is_white = (row_pixels > 245).all(axis=1)
    white_ratio = is_white.mean()
    if white_ratio > 0.5:
        print(f"y={y:3d}: white_ratio={white_ratio:.2f}")

# Inspect vertical white margins between columns
print("\nVertical white margins:")
for x in range(0, W, 10):
    col_pixels = arr[:, x, :]
    is_white = (col_pixels > 245).all(axis=1)
    white_ratio = is_white.mean()
    if white_ratio > 0.4:
        print(f"x={x:4d}: white_ratio={white_ratio:.2f}")
