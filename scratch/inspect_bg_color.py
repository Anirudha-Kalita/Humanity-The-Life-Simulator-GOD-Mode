from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792672019591_fb8d1b2c.jpg')
arr = np.array(img)
H, W = arr.shape[:2]

print("Corner 0,0:", arr[0,0])
print("Sample at x=200, y=10:", arr[10, 200])
print("Sample between row 0 and 1: y=165, x=100:", arr[165, 100])
print("Sample text pill area: y=155, x=100:", arr[155, 100])
