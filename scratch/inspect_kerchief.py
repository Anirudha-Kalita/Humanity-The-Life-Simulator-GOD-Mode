from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792666529723_ed2a19c9.jpg')
arr = np.array(img)

# Front idle is in Y=[25, 224], X=[0, 256]
front_idle = arr[25:225, :256]
r = front_idle[:, :, 0].astype(int)
g = front_idle[:, :, 1].astype(int)
b = front_idle[:, :, 2].astype(int)

# Check the kerchief at the top: Y in [0, 40], X around center
top_kerchief = front_idle[5:35, 100:150]
print("Top kerchief sample colors (RGB):")
print("  mean:", top_kerchief.mean(axis=(0,1)))
print("  min:", top_kerchief.min(axis=(0,1)))
print("  max:", top_kerchief.max(axis=(0,1)))

# Check the outline of the kerchief
# There is a dark outline around the entire kerchief!
# Let's verify that the kerchief is completely surrounded by a dark line
# (e.g. brightness < 120 or dev of dark outlines)
print("Dark pixels in front_idle:", np.count_nonzero((r+g+b)//3 < 80))
