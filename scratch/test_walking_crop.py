from PIL import Image
import numpy as np

im = Image.open('scratch/pregnant_cards/2_0_walking.png')
# Crop character region
crop = im.crop((35, 8, 140, 138))
crop.save('scratch/test_walking_crop.png')
print("Saved scratch/test_walking_crop.png, size:", crop.size)
