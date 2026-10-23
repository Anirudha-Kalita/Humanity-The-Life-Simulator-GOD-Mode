from PIL import Image
import numpy as np
import scipy.ndimage

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

col_splits = [200, 330, 475, 610, 735, 870, 1015]
poses = ["preparing_food", "stirring_pot", "serving_food", "cleaning", "washing_dishes", "taking_break"]

for c_idx in range(6):
    x0, x1 = col_splits[c_idx], col_splits[c_idx + 1]
    cell = arr[124:215, x0:x1]
    bright = cell.mean(axis=2)
    dark_outline = (bright < 95)
    traversable = (bright > 180) & (~dark_outline)

    lbl, num = scipy.ndimage.label(traversable)
    bg_seed = np.zeros(cell.shape[:2], dtype=bool)
    bg_seed[0, :] = True
    bg_seed[-1, :] = True
    bg_seed[:, 0] = True
    bg_seed[:, -1] = True

    border_labels = set(np.unique(lbl[bg_seed])) - {0}
    bg_mask = np.isin(lbl, list(border_labels))

    alpha = (~bg_mask).astype(np.uint8) * 255
    rgba = np.dstack([cell, alpha])
    im = Image.fromarray(rgba, 'RGBA')
    bbox = im.getbbox()
    print(f"Col {c_idx} ({poses[c_idx]:16s}): bbox={bbox}, size={im.crop(bbox).size if bbox else None}")
