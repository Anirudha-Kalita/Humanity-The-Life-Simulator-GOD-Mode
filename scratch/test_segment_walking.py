from PIL import Image
import numpy as np
import scipy.ndimage

im = Image.open('scratch/test_walking_crop.png')
arr = np.array(im)
H, W = arr.shape[:2]

r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
bright = (r + g + b) // 3

# Dark outlines are < 85
is_outline = (bright < 85)

# We can find the background by flood-filling from the borders,
# but we need to make sure we don't leak through any small 1-px gaps in the outline.
# Outline dilation (by 1 px) ensures complete seal:
struct = scipy.ndimage.generate_binary_structure(2, 2)
sealed_outline = scipy.ndimage.binary_dilation(is_outline, structure=struct, iterations=1)

# Flood fill from image borders:
traversable = ~sealed_outline
lbl, num = scipy.ndimage.label(traversable)

# Border connected
seed_mask = np.zeros((H, W), dtype=bool)
seed_mask[0, :] = True
seed_mask[-1, :] = True
seed_mask[:, 0] = True
seed_mask[:, -1] = True

border_labels = set(np.unique(lbl[seed_mask])) - {0}
bg_mask = np.isin(lbl, list(border_labels))

# Erode bg_mask back by 1 px so we don't eat into the character outline:
bg_mask = scipy.ndimage.binary_dilation(bg_mask, structure=struct, iterations=1)

alpha = (~bg_mask).astype(np.uint8) * 255
rgba = np.dstack([arr, alpha])
im_out = Image.fromarray(rgba, 'RGBA')
bbox = im_out.getbbox()
print("Segmented character bbox:", bbox)
if bbox:
    cropped = im_out.crop(bbox)
    cropped.save('scratch/test_walking_segmented.png')
    print("Saved scratch/test_walking_segmented.png, size:", cropped.size)
