from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\aniru\.gemini\antigravity\brain\788f8153-2c7d-498e-abe7-7d3c8b7d5f07\.user_uploaded\media_1792670781710_6ec287d8.jpg')
arr = np.array(img)
H, W = arr.shape[:2]

row_info = [
    ("Elderly Man", [10, 118], [234, 242, 221]),
    ("Young Woman", [124, 232], [252, 245, 219]),
    ("Guard", [238, 346], [226, 240, 253]),
    ("Lumberjack", [352, 460], [237, 245, 230]),
    ("Farmer Girl", [466, 574], [250, 238, 238]),
    ("Wizard/Healer", [580, 680], [236, 239, 254])
]

for name, (y0, y1), bg_col in row_info:
    patch = arr[y0:y1, 210:320]
    bg = np.array(bg_col)
    diff = np.abs(patch.astype(int) - bg).max(axis=2)
    fg = diff > 15
    row_sums = fg.sum(axis=1)
    
    # Find zero gap before text
    # Character starts near 0..10
    # Text is usually in the bottom 20 px
    char_ys = np.where(row_sums > 0)[0]
    # Let's inspect where the character ends
    print(f"\n{name} (y={y0}..{y1}):")
    for y in range(len(row_sums) - 25, len(row_sums)):
        print(f"  abs y={y0+y}: sum={row_sums[y]}")
