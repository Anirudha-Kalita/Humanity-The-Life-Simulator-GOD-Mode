from PIL import Image
import numpy as np

im_angry = Image.open('scratch/forager_cells/2_3_angry.png')
print("Angry size:", im_angry.size)
arr_a = np.array(im_angry)
# In angry patch: col_w = 1024 / 5 = 204.8. Col 3 is [614, 819].
# What is at x=0 in angry?
print("Non-zero alpha near left edge of angry (x in 0..10):")
print(np.where(arr_a[:, :10, 3] > 0))

im_defend = Image.open('scratch/forager_cells/3_3_basket_defend.png')
print("Defend size:", im_defend.size)
arr_d = np.array(im_defend)
print("Non-zero alpha near left edge of defend (x in 0..10):")
print(np.where(arr_d[:, :10, 3] > 0))
