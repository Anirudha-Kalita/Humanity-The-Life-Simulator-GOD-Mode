from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)

# Row 1 (Young Woman, x in [200, 330])
cell = arr[124:215, 200:330]
# Sample top-left corner 10x10 and bottom-left corner 10x10
tl = cell[:10, :10]
bl = cell[-10:, :10]
print("tl mean:", tl.mean(axis=(0,1)))
print("bl mean:", bl.mean(axis=(0,1)))

# If we compute background using vertical interpolation from top to bottom
top_col = cell[:3, :].mean(axis=(0,1))
bot_col = cell[-3:, :].mean(axis=(0,1))
print("top_col:", top_col, "bot_col:", bot_col)

# Linear gradient background:
ys = np.linspace(0, 1, cell.shape[0])[:, None, None]
bg_grad = (1 - ys) * top_col + ys * bot_col
grad_diff = np.abs(cell.astype(float) - bg_grad).max(axis=2)
print("Background corner grad_diff:", grad_diff[:5, :5].max(), grad_diff[-5:, :5].max())
print("Border grad_diff max:", max(grad_diff[0, :].max(), grad_diff[-1, :].max(), grad_diff[:, 0].max(), grad_diff[:, -1].max()))
