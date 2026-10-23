import numpy as np
from PIL import Image

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792666529723_ed2a19c9.jpg')
arr = np.array(img)

# Let's inspect Row 2 (y in [485, 688])
# Columns are:
# Col 0 (sitting): x around 0..200
# Col 1 (resting): x around 200..400
# Col 2 (loving): x around 400..600
# Col 3 (angry): x around 600..800
# Col 4 (surprised): x around 800..1024

# Let's find the character centers in Row 2
r2 = arr[485:688, :]
r2_dev = np.maximum(np.maximum(np.abs(r2[:,:,0].astype(int)-r2[:,:,1].astype(int)),
                               np.abs(r2[:,:,0].astype(int)-r2[:,:,2].astype(int))),
                    np.abs(r2[:,:,1].astype(int)-r2[:,:,2].astype(int)))
r2_bright = r2.mean(axis=2)
r2_fg = (r2_dev >= 8) | (r2_bright < 220)

col_sums = r2_fg.sum(axis=0)
print("Row 2 column projection (every 20 px):")
for x in range(0, 1024, 25):
    print(f"x={x:4d}: {col_sums[x:x+25].sum():4d}")

# And Row 3
r3 = arr[715:898, :]
r3_dev = np.maximum(np.maximum(np.abs(r3[:,:,0].astype(int)-r3[:,:,1].astype(int)),
                               np.abs(r3[:,:,0].astype(int)-r3[:,:,2].astype(int))),
                    np.abs(r3[:,:,1].astype(int)-r3[:,:,2].astype(int)))
r3_bright = r3.mean(axis=2)
r3_fg = (r3_dev >= 8) | (r3_bright < 220)

col3_sums = r3_fg.sum(axis=0)
print("\nRow 3 column projection (every 20 px):")
for x in range(0, 1024, 25):
    print(f"x={x:4d}: {col3_sums[x:x+25].sum():4d}")
