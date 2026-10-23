from PIL import Image
import numpy as np
import scipy.ndimage

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

# Row 1 Col 0: preparing food
cell = arr[124:215, 200:330]
bright = cell.mean(axis=2)

# Flood fill starting from the outer borders:
# Any pixel with brightness > 120 that does not hit an outline (< 100)
# Note: table top is wooden brown (brightness around 140..180), BUT it has dark black outlines around it!
# Let's check the outline around the table:
dark_outline = (bright < 95)
# Any pixel reachable from borders without crossing dark_outline:
# We can use binary dilation or flood fill:
bg_seed = np.zeros(cell.shape[:2], dtype=bool)
bg_seed[0, :] = True
bg_seed[-1, :] = True
bg_seed[:, 0] = True
bg_seed[:, -1] = True

# A pixel is traversable for background if it is NOT dark outline (bright >= 95)
# AND brightness > 160 (all background in Row 1 has brightness > 220!)
traversable = (bright > 180) & (~dark_outline)

lbl, num = scipy.ndimage.label(traversable)
border_labels = set(np.unique(lbl[bg_seed])) - {0}
bg_mask = np.isin(lbl, list(border_labels))

alpha = (~bg_mask).astype(np.uint8) * 255
rgba = np.dstack([cell, alpha])
im = Image.fromarray(rgba, 'RGBA')
bbox = im.getbbox()
print("Preparing food with traversable (bright>180 & not outline):")
print("bbox:", bbox, "size:", im.crop(bbox).size if bbox else None)
