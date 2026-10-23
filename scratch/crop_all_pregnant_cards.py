import os
from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792672019591_fb8d1b2c.jpg')
arr = np.array(img)

# Exact positions of the 20 cards:
# 5 columns:
# x0, x1 for the 5 columns:
# Total W = 1024
# Margins: left~8, right~1016. Each card width is ~190 px, gap ~12 px
# Let's inspect column boundaries
col_bounds = [
    (8, 198),
    (210, 400),
    (412, 602),
    (614, 804),
    (816, 1006)
]

# 4 rows:
# Total H = 682
# Each row has an image box + a text pill underneath
# Row 0: y in [8, 148] (text pill in [150, 166])
# Row 1: y in [178, 318] (text pill in [320, 336])
# Row 2: y in [348, 488] (text pill in [490, 506])
# Row 3: y in [518, 658] (text pill in [660, 676])
row_bounds = [
    (8, 148),
    (178, 318),
    (348, 488),
    (518, 658)
]

os.makedirs('scratch/pregnant_cards', exist_ok=True)

card_names = [
    ["cooking", "cleaning", "washing_clothes", "child_care", "resting"],
    ["shopping", "checking_health", "drinking_water", "gardening", "reading"],
    ["walking", "preparing_food", "relaxing", "listening_music", "with_family"],
    ["doing_laundry", "watching_tv", "stretching", "bathing", "preparing_baby"]
]

for r_idx in range(4):
    y0, y1 = row_bounds[r_idx]
    for c_idx in range(5):
        x0, x1 = col_bounds[c_idx]
        name = card_names[r_idx][c_idx]
        card = arr[y0:y1, x0:x1]
        im_card = Image.fromarray(card)
        im_card.save(f"scratch/pregnant_cards/{r_idx}_{c_idx}_{name}.png")
        print(f"Saved {name:16s} ({x0}..{x1}, {y0}..{y1}): {im_card.size}")
