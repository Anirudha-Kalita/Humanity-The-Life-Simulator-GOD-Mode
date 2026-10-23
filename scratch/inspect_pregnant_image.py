from PIL import Image
import numpy as np

img_path = r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792672019591_fb8d1b2c.jpg'
img = Image.open(img_path)
print(f"Image size: {img.size}")
arr = np.array(img)
H, W = arr.shape[:2]

# The image has 4 rows and 5 columns
# Let's inspect row heights: 682 / 4 = ~170.5 px
# Width: 1024 / 5 = ~204.8 px
print(f"Rough cell size: {W/5:.1f} x {H/4:.1f}")
