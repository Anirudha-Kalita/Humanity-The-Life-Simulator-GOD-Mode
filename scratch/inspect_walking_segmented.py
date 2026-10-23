from PIL import Image
import numpy as np

im = Image.open('scratch/test_walking_segmented.png')
arr = np.array(im)
a = arr[:, :, 3]
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
bright = (r.astype(int) + g.astype(int) + b.astype(int)) // 3

# Check pixels at corners of the bounding box where alpha > 0
print("Corner 0,0 alpha:", a[0, 0])
print("Corner 0,-1 alpha:", a[0, -1])
print("Corner -1,0 alpha:", a[-1, 0])
print("Corner -1,-1 alpha:", a[-1, -1])

# Non-zero alpha pixels distribution
ys, xs = np.where(a > 0)
print(f"Non-zero alpha: count={len(ys)}, Y=[{ys.min()}, {ys.max()}], X=[{xs.min()}, {xs.max()}]")
