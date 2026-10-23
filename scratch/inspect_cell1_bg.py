from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

# Let's inspect Row 1: y in [124, 215]
# Sample border pixels of cell 0 (x in [200, 330])
cell1 = arr[124:215, 200:330]
print("Cell 1 top-left 5x5:", cell1[:5, :5].mean(axis=(0,1)))
print("Cell 1 top-right 5x5:", cell1[:5, -5:].mean(axis=(0,1)))
print("Cell 1 bot-left 5x5:", cell1[-5:, :5].mean(axis=(0,1)))
print("Cell 1 bot-right 5x5:", cell1[-5:, -5:].mean(axis=(0,1)))

# Let's check max_dev of background in Row 1
dev = np.maximum(np.maximum(np.abs(cell1[:,:,0].astype(int)-cell1[:,:,1].astype(int)),
                            np.abs(cell1[:,:,0].astype(int)-cell1[:,:,2].astype(int))),
                 np.abs(cell1[:,:,1].astype(int)-cell1[:,:,2].astype(int)))
bright = cell1.mean(axis=2)
print("Cell 1 top-left max_dev:", dev[:5, :5].mean(), "bright:", bright[:5, :5].mean())
