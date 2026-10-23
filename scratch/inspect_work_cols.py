from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

# Let's inspect Row 0: y in [8, 116]
r0 = arr[8:116, :]
bg0 = np.array([234, 242, 221])
diff0 = np.abs(r0.astype(int) - bg0).max(axis=2)
fg0 = diff0 > 15

col_sums0 = fg0.sum(axis=0)
print("Row 0 column projection (every 25 px):")
for x in range(0, 1024, 25):
    print(f"x={x:4d}: {col_sums0[x:x+25].sum():4d}")
