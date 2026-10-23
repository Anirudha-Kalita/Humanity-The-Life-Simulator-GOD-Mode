from PIL import Image
import numpy as np

im = Image.open('scratch/test_card_walking.png')
arr = np.array(im)
print("Card shape:", arr.shape)

# Let's inspect the colors of the character inside the card:
# Hair is brown: [100..150, 40..80, 20..50]
# Dress is burgundy/pink: [150..210, 60..100, 80..120]
# Apron is soft pink: [240..255, 200..230, 210..235]
# Let's find where the character is located inside the card:
r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)

# In the card, the background is sky (blue) and grass (green) and path (tan/sand)
# The character has dark black/brown outlines (brightness < 80)
dark_outlines = (r + g + b) // 3 < 70
ys, xs = np.where(dark_outlines)
print(f"Dark outlines in card: Y=[{ys.min()}, {ys.max()}], X=[{xs.min()}, {xs.max()}]")
