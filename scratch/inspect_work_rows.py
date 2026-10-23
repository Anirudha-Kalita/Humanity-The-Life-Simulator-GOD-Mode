from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)
H, W = arr.shape[:2]

# The image has 6 rows. Total height is 682.
# 682 / 6 is ~113.6 px per row.
# Let's inspect horizontal dividing lines or row backgrounds:
for y in range(0, H, 20):
    row_colors = arr[y, [50, 200, 400, 600, 800, 1000]]
    print(f"y={y:3d}: x=200={row_colors[1]}, x=600={row_colors[3]}")
