import os
from PIL import Image
import numpy as np

img_path = r'C:\Users\aniru\OneDrive\Desktop\Game\scratch\inspect_lumberjack_rows.py'
img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792665990128_a45de65b.jpg')
arr = np.array(img)

# Let's inspect Col 2 in Row 3 (axe_attack): Y in 715..905, X in 409..614
axe_patch = arr[715:905, int(round(2 * 1024 / 5)):int(round(3 * 1024 / 5))]
# And Col 4 in Row 3 (tired):
tired_patch = arr[715:905, int(round(4 * 1024 / 5)):1024]

print("Axe patch shape:", axe_patch.shape)
print("Tired patch shape:", tired_patch.shape)

# Check the color of axe blade in axe_patch:
# The axe blade is on the right side of axe_attack
r = axe_patch[:, :, 0].astype(int)
g = axe_patch[:, :, 1].astype(int)
b = axe_patch[:, :, 2].astype(int)
dev = np.maximum(np.maximum(np.abs(r-g), np.abs(r-b)), np.abs(g-b))
bright = (r + g + b) // 3

# Is there any region enclosed by dark lines?
dark_lines = (bright < 80)
print("Dark line pixels in axe_attack:", np.count_nonzero(dark_lines))

# For the breath puff in tired:
tr = tired_patch[:, :, 0].astype(int)
tg = tired_patch[:, :, 1].astype(int)
tb = tired_patch[:, :, 2].astype(int)
tdev = np.maximum(np.maximum(np.abs(tr-tg), np.abs(tr-tb)), np.abs(tg-tb))
tbright = (tr + tg + tb) // 3
tpuff = (tbright > 180) & (tired_patch[:, :, 2] > tired_patch[:, :, 0] + 5) # bluish puff?
print("Puff bluish pixels:", np.count_nonzero(tpuff))
