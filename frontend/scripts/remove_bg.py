import sys
import os
from PIL import Image

def remove_white_background(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: Input file {input_path} not found.")
        return False
    
    # Open image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    data = img.load()
    
    # Queue-based flood fill starting from all border pixels
    visited = set()
    queue = []
    
    # Add all border pixels as seeds
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    bg_pixels = []
    
    # Process queue
    while queue:
        cx, cy = queue.pop(0)
        if (cx, cy) in visited:
            continue
        visited.add((cx, cy))
        
        r, g, b, a = data[cx, cy]
        # Check if the pixel is white-ish (high brightness)
        # Most generated images have pure white (255, 255, 255) backgrounds
        if r > 240 and g > 240 and b > 240:
            bg_pixels.append((cx, cy))
            # Add 4-connected neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))
                    
    # Convert detected background pixels to transparent
    for x, y in bg_pixels:
        data[x, y] = (0, 0, 0, 0)
        
    # Crop the image to the bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Success: Background removed. Saved to {output_path}. Cropped Size: {img.size}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input_path> <output_path>")
    else:
        remove_white_background(sys.argv[1], sys.argv[2])
