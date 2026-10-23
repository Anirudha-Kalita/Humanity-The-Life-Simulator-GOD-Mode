import os
from PIL import Image
import numpy as np

img_path = r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792665990128_a45de65b.jpg'
img = Image.open(img_path)
print(f"Image size: {img.size}")
arr = np.array(img)
# Sample corner pixels for checkerboard
print("Corner 0,0:", arr[0,0])
print("Corner 10,10:", arr[10,10])
print("Sample checkerboard near top-left:")
for y in range(0, 30, 5):
    row_str = " ".join(f"{arr[y, x, 0]:3d}" for x in range(0, 50, 5))
    print(f"y={y:2d}: {row_str}")
