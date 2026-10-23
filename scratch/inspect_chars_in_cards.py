from PIL import Image
import numpy as np

for name in ['2_0_walking.png', '1_2_drinking_water.png', '0_1_cleaning.png', '1_0_shopping.png']:
    im = Image.open(f'scratch/pregnant_cards/{name}')
    arr = np.array(im)
    r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
    bright = (r + g + b) // 3
    # Find head/hair: brown hair is r in [90..160], g in [40..90], b in [20..60]
    hair = (r > 80) & (r < 170) & (g > 30) & (g < 100) & (b > 15) & (b < 75) & (r > g + 25)
    ys_h, xs_h = np.where(hair)
    print(f"{name:25s}: hair pixels={len(ys_h)}, hair Y=[{ys_h.min() if len(ys_h) else 0}, {ys_h.max() if len(ys_h) else 0}], hair X=[{xs_h.min() if len(xs_h) else 0}, {xs_h.max() if len(xs_h) else 0}]")
