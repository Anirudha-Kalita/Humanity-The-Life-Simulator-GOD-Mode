from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792672019591_fb8d1b2c.jpg')
arr = np.array(img)
H, W = arr.shape[:2]

# 4 rows, 5 columns
# Let's find the card box bounds
# The total image is 1024x682.
# 5 columns: roughly x = [8..200], [210..402], [412..604], [614..806], [816..1008]
# 4 rows: roughly y = [8..148], [178..318], [348..488], [518..658]
# Text labels are at the bottom of each card.

# Let's inspect the cards in Row 2 (Walking, etc.):
# Walking is Row 2, Col 0: Y ~ [340, 500], X ~ [8, 205]
card_walking = arr[340:500, 8:205]
im_walking = Image.fromarray(card_walking)
im_walking.save('scratch/test_card_walking.png')
print("Saved scratch/test_card_walking.png, size:", im_walking.size)
