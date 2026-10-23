import os
from PIL import Image

poses_dir = 'scratch/pregnant_poses'

for f in sorted(os.listdir(poses_dir)):
    if f.endswith('.png'):
        im = Image.open(f"{poses_dir}/{f}")
        w, h = im.size
        scale = min(66.0 / h, 58.0 / w, 0.52)
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
        print(f"{f:22s}: src=({w:3d},{h:3d}) -> ({tw:2d},{th:2d}), pos=({x:2d},{y:2d}), clip={clip}")
