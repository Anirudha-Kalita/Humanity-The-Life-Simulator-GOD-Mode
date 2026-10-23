from PIL import Image
import numpy as np

img_path = r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg'
img = Image.open(img_path)
print(f"Image size: {img.size}")
arr = np.array(img)
H, W = arr.shape[:2]

corner = arr[:40, :40]
print("Top-left 0,0:", corner[0,0])
