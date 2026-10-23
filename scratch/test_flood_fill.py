import numpy as np
import scipy.ndimage
from PIL import Image

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

# Test on Row 1 (Young Woman, Col 0: preparing_food)
patch = arr[124:215, 200:330]
bright = patch.mean(axis=2)

# Dark outlines are < 110
is_not_outline = bright > 130
lbl, num = scipy.ndimage.label(is_not_outline)
# Connected to border
border_lbls = set(np.unique(lbl[0, :])).union(
    np.unique(lbl[-1, :]),
    np.unique(lbl[:, 0]),
    np.unique(lbl[:, -1])
) - {0}
bg_mask = np.isin(lbl, list(border_lbls))

alpha = (~bg_mask).astype(np.uint8) * 255
rgba = np.dstack([patch, alpha])
im = Image.fromarray(rgba, 'RGBA')
bbox = im.getbbox()
print("Preparing food bbox:", bbox, "cropped size:", im.crop(bbox).size if bbox else None)
