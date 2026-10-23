import numpy as np
from PIL import Image

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792666529723_ed2a19c9.jpg')
arr = np.array(img)

# Row 3 Y in [715, 898]
r3 = arr[715:898, 600:660]
dev = np.maximum(np.maximum(np.abs(r3[:,:,0].astype(int)-r3[:,:,1].astype(int)),
                            np.abs(r3[:,:,0].astype(int)-r3[:,:,2].astype(int))),
                 np.abs(r3[:,:,1].astype(int)-r3[:,:,2].astype(int)))
bright = r3.mean(axis=2)
fg = (dev >= 8) | (bright < 220)

for x in range(600, 660, 5):
    sub = fg[:, x-600:x-600+5]
    print(f"x={x}..{x+4}: count={sub.sum()}")
