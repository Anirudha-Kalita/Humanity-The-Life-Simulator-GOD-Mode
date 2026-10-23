import numpy as np
from PIL import Image

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792668526317_be9b961a.jpg')
arr = np.array(img)

# Row 2 (y in [485, 689])
r2 = arr[485:689, :]
r2_dev = np.maximum(np.maximum(np.abs(r2[:,:,0].astype(int)-r2[:,:,1].astype(int)),
                               np.abs(r2[:,:,0].astype(int)-r2[:,:,2].astype(int))),
                    np.abs(r2[:,:,1].astype(int)-r2[:,:,2].astype(int)))
r2_bright = r2.mean(axis=2)
r2_fg = (r2_dev >= 8) | (r2_bright < 220)

col_sums = r2_fg.sum(axis=0)
print("Row 2 column projection (every 25 px):")
for x in range(0, 1024, 25):
    print(f"x={x:4d}: {col_sums[x:x+25].sum():4d}")

# Row 3 (y in [715, 905])
r3 = arr[715:905, :]
r3_dev = np.maximum(np.maximum(np.abs(r3[:,:,0].astype(int)-r3[:,:,1].astype(int)),
                               np.abs(r3[:,:,0].astype(int)-r3[:,:,2].astype(int))),
                    np.abs(r3[:,:,1].astype(int)-r3[:,:,2].astype(int)))
r3_bright = r3.mean(axis=2)
r3_fg = (r3_dev >= 8) | (r3_bright < 220)

col3_sums = r3_fg.sum(axis=0)
print("\nRow 3 column projection (every 25 px):")
for x in range(0, 1024, 25):
    print(f"x={x:4d}: {col3_sums[x:x+25].sum():4d}")
