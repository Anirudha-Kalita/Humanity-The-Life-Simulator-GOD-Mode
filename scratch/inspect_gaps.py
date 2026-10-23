import numpy as np
from PIL import Image

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792668526317_be9b961a.jpg')
arr = np.array(img)

# Row 2 (y in [485, 689])
r2 = arr[485:689, 810:845]
dev = np.maximum(np.maximum(np.abs(r2[:,:,0].astype(int)-r2[:,:,1].astype(int)),
                            np.abs(r2[:,:,0].astype(int)-r2[:,:,2].astype(int))),
                 np.abs(r2[:,:,1].astype(int)-r2[:,:,2].astype(int)))
bright = r2.mean(axis=2)
fg = (dev >= 8) | (bright < 220)

for x in range(810, 845):
    print(f"Row 2 x={x}: count={fg[:, x-810].sum()}")

# Row 3 (y in [715, 905]) between 400 and 430, and 800 and 840
r3 = arr[715:905, 400:435]
dev3 = np.maximum(np.maximum(np.abs(r3[:,:,0].astype(int)-r3[:,:,1].astype(int)),
                             np.abs(r3[:,:,0].astype(int)-r3[:,:,2].astype(int))),
                  np.abs(r3[:,:,1].astype(int)-r3[:,:,2].astype(int)))
bright3 = r3.mean(axis=2)
fg3 = (dev3 >= 8) | (bright3 < 220)

for x in range(400, 435):
    print(f"Row 3 x={x}: count={fg3[:, x-400].sum()}")

r3_2 = arr[715:905, 800:835]
dev3_2 = np.maximum(np.maximum(np.abs(r3_2[:,:,0].astype(int)-r3_2[:,:,1].astype(int)),
                               np.abs(r3_2[:,:,0].astype(int)-r3_2[:,:,2].astype(int))),
                    np.abs(r3_2[:,:,1].astype(int)-r3_2[:,:,2].astype(int)))
bright3_2 = r3_2.mean(axis=2)
fg3_2 = (dev3_2 >= 8) | (bright3_2 < 220)

for x in range(800, 835):
    print(f"Row 3 (800+) x={x}: count={fg3_2[:, x-800].sum()}")
