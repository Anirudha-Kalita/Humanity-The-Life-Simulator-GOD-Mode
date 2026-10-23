import os
from PIL import Image
import numpy as np

atlases = [
    'src/assets/animations/elderly_man.png',
    'src/assets/animations/lumberjack.png',
    'src/assets/animations/woodcutter.png',
    'src/assets/animations/healer.png',
    'src/assets/animations/guard.png',
    'src/assets/animations/hunter.png',
    'src/assets/animations/cook.png',
    'src/assets/animations/baker.png',
    'src/assets/animations/female_farmer.png',
    'src/assets/animations/forager.png',
    'src/assets/animations/child_girl.png'
]

for p in atlases:
    im = Image.open(p)
    arr = np.array(im)
    assert im.size == (256, 1440), f"{p} wrong size: {im.size}"
    
    # Check baseline on the work rows (rows 8, 12, 14, 15, 16, 17)
    work_rows = [8, 12, 14, 15, 16, 17]
    row_baselines = []
    for r in work_rows:
        row_patch = arr[r * 80 : (r + 1) * 80, :]
        a = row_patch[:, :, 3]
        ys, xs = np.where(a > 0)
        row_baselines.append(f"R{r}:{ys.max()}")
    print(f"{os.path.basename(p):18s}: size={im.size}, baselines={', '.join(row_baselines)}")

print("\nAll atlases verified successfully!")
