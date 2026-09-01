import pymupdf
import os
from PIL import Image

pdf_path = r'C:\Users\Ventures\.gemini\antigravity-ide\brain\ea31dac9-114a-4a23-a9e9-b9fe13b0d68f\.user_uploaded\media_1788195163471.pdf'
doc = pymupdf.open(pdf_path)
print(f'Total PDF pages: {len(doc)}')

out_dir = r'd:\Mwangi\Green-Ngoria-Website\scratch\pdf_extracted'
os.makedirs(out_dir, exist_ok=True)

img_count = 0
for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images(full=True)
    print(f'Page {page_num+1}: {len(image_list)} images')
    for img_idx, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image['image']
        image_ext = base_image['ext']
        w = base_image['width']
        h = base_image['height']
        img_name = f'page_{page_num+1:02d}_img_{img_idx+1}_{xref}.{image_ext}'
        img_path = os.path.join(out_dir, img_name)
        with open(img_path, 'wb') as f:
            f.write(image_bytes)
        img_count += 1
        print(f'   Saved {img_name} ({w}x{h}, {len(image_bytes)/1024:.1f} KB)')

print(f'\nTotal images extracted: {img_count}')
