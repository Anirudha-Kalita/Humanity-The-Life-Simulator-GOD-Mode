import os
from PIL import Image

work_dir = 'scratch/work_poses'

# Test scaling and placement of all 36 poses into 64x80 cells
for f in sorted(os.listdir(work_dir)):
    if f.endswith('.png'):
        im = Image.open(f"{work_dir}/{f}")
        w, h = im.size
        
        # We want standing characters to be ~64-66px high, and wide objects to fit inside width 60px
        scale = min(66.0 / h, 58.0 / w, 0.76)
        tw = int(round(w * scale))
        th = int(round(h * scale))
        resized = im.resize((tw, th), Image.Resampling.LANCZOS)
        
        cell = Image.new('RGBA', (64, 80), (0, 0, 0, 0))
        cx = 32
        by = 76
        x = int(round(cx - tw / 2.0))
        y = int(round(by - th))
        cell.paste(resized, (x, y), resized)
        bbox = cell.getbbox()
        clip = (x < 0 or x + tw > 64 or y < 0 or y + th > 80)
        print(f"{f:38s}: src=({w:3d},{h:2d}) -> ({tw:2d},{th:2d}), pos=({x:2d},{y:2d}), clip={clip}")
