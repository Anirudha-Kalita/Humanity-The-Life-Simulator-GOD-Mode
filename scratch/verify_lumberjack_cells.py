import os
from PIL import Image
import numpy as np

for f in sorted(os.listdir('scratch/lumberjack_cells')):
    if f.endswith('.png'):
        im = Image.open(f'scratch/lumberjack_cells/{f}')
        arr = np.array(im)
        a = arr[:, :, 3]
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        max_dev = np.maximum(np.maximum(np.abs(r.astype(int) - g.astype(int)),
                                        np.abs(r.astype(int) - b.astype(int))),
                             np.abs(g.astype(int) - b.astype(int)))
        brightness = (r.astype(int) + g.astype(int) + b.astype(int)) // 3
        bg_like = (a > 0) & (max_dev <= 3) & (brightness >= 235)
        print(f"{f:32s}: size={im.size}, alpha>0={np.count_nonzero(a)}, bg_like={np.count_nonzero(bg_like)}")
