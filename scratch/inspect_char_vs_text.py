from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

# Inspect Y in Row 0 (Col 0: Watering Plants, x in [210, 320])
patch = arr[8:120, 210:320]
bg = np.array([234, 242, 221])
diff = np.abs(patch.astype(int) - bg).max(axis=2)
fg = diff > 15

row_sums = fg.sum(axis=1)
for y in range(len(row_sums)):
    print(f"y_rel={y:2d} (abs y={8+y:3d}): {row_sums[y]:3d}")
