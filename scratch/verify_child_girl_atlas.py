from PIL import Image
import numpy as np

atlas = Image.open('src/assets/animations/child_girl.png')
print(f"Atlas size: {atlas.size}")
portrait = Image.open('src/assets/npcs/child_girl.png')
print(f"Portrait size: {portrait.size}")

arr = np.array(atlas)
print(f"Atlas array shape: {arr.shape}")

# Row 1 is walkLeft (Y from 80 to 160)
# Row 3 is walkRight (Y from 240 to 320)
left_cell_0 = arr[80:160, 0:64]
right_cell_0 = arr[240:320, 0:64]

l_alpha = left_cell_0[:, :, 3]
r_alpha = right_cell_0[:, :, 3]

l_ys, l_xs = np.where(l_alpha > 0)
r_ys, r_xs = np.where(r_alpha > 0)

print(f"Left walk frame 0: X min={l_xs.min()}, max={l_xs.max()}, mean={l_xs.mean():.2f}")
print(f"Right walk frame 0: X min={r_xs.min()}, max={r_xs.max()}, mean={r_xs.mean():.2f}")

# Check feet baseline across all rows
for r in range(18):
    row_patch = arr[r * 80 : (r + 1) * 80, 0 : 64 * 4]
    a = row_patch[:, :, 3]
    ys, xs = np.where(a > 0)
    print(f"Row {r:2d}: Y max (feet) = {ys.max():2d}, Y min (top) = {ys.min():2d}")
