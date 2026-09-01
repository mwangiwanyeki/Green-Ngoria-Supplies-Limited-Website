import os
from PIL import Image, ImageEnhance, ImageFilter

src_extracted = r'd:\Mwangi\Green-Ngoria-Website\scratch\pdf_extracted'
dest_img_dir = r'd:\Mwangi\Green-Ngoria-Website\web\public\images'
os.makedirs(dest_img_dir, exist_ok=True)

# Subdirectories for clean organization
categories = [
    'hero',
    'leadership',
    'mining',
    'gemstones',
    'construction',
    'roads',
    'water',
    'mechanical',
    'electrical',
    'energy',
    'timber',
    'certifications',
    'projects',
]

for cat in categories:
    os.makedirs(os.path.join(dest_img_dir, cat), exist_ok=True)

def process_image(src_file, dest_rel_path, target_max_dim=1200, quality=85):
    full_src = os.path.join(src_extracted, src_file)
    full_dest = os.path.join(dest_img_dir, dest_rel_path)
    
    if not os.path.exists(full_src):
        print(f'Warning: {full_src} not found')
        return
        
    img = Image.open(full_src)
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    # Resize if larger than target_max_dim
    w, h = img.size
    if max(w, h) > target_max_dim:
        scale = target_max_dim / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        
    # Enhance quality: slight sharpness enhancement and subtle contrast boost
    enhancer_sharp = ImageEnhance.Sharpness(img)
    img = enhancer_sharp.enhance(1.25)
    
    enhancer_contrast = ImageEnhance.Contrast(img)
    img = enhancer_contrast.enhance(1.05)
    
    # Save as WebP or JPEG with quality loop to guarantee < 190 KB
    q = quality
    while q >= 50:
        img.save(full_dest, 'WEBP' if full_dest.endswith('.webp') else 'JPEG', quality=q, optimize=True)
        size_kb = os.path.getsize(full_dest) / 1024
        if size_kb <= 190:
            break
        q -= 5
        
    print(f'Processed {dest_rel_path}: {img.size[0]}x{img.size[1]}, {size_kb:.1f} KB (quality={q})')

# Mapping from extracted PDF images to semantic website assets
image_map = {
    # Leadership
    'page_07_img_1_48.jpeg': 'leadership/kenneth-madete-namboga.webp',
    'page_07_img_2_75.jpeg': 'leadership/davis-mragha-ngoo.webp',
    'page_07_img_3_76.jpeg': 'leadership/raymond-nyange-ngoo.webp',
    'page_07_img_4_77.jpeg': 'leadership/chrispine-ryan-ngoo.webp',

    # Mining & Gold Processing
    'page_08_img_1_67.jpeg': 'mining/gold-ore-specimen.webp',
    'page_09_img_1_92.jpeg': 'mining/poured-dore-bar-bondo.webp',
    'page_09_img_2_93.jpeg': 'mining/gold-nuggets-raw.webp',
    'page_09_img_3_94.jpeg': 'mining/production-weighed-digital-scale.webp',
    'page_11_img_1_110.jpeg': 'mining/ball-mill-installation-bondo.webp',
    'page_11_img_2_111.jpeg': 'mining/leach-cil-tank-construction.webp',
    'page_11_img_3_112.jpeg': 'mining/centrifugal-concentrators.webp',
    'page_11_img_4_113.jpeg': 'mining/gravity-sluice-table.webp',
    'page_11_img_5_114.jpeg': 'mining/shaft-hoisting-gear.webp',
    'page_01_img_1_4.png': 'mining/drilling-rig-mast.webp',

    # Gemstones
    'page_10_img_1_102.jpeg': 'gemstones/cut-tanzanite-parcel.webp',
    'page_10_img_2_103.jpeg': 'gemstones/cut-blue-sapphire.webp',
    'page_10_img_3_104.jpeg': 'gemstones/ruby-in-matrix.webp',
    'page_10_img_4_105.jpeg': 'gemstones/green-tsavorite-rough.webp',
    'page_10_img_5_106.jpeg': 'gemstones/tanzanite-rough-crystal.webp',

    # Construction & Building Works
    'page_12_img_1_68.jpeg': 'construction/grand-park-complex.webp',
    'page_13_img_2_126.jpeg': 'construction/residential-villa-design-build.webp',
    'page_13_img_3_127.jpeg': 'construction/commercial-property-nairobi.webp',
    'page_13_img_4_128.jpeg': 'construction/institutional-building-project.webp',
    'page_13_img_5_129.jpeg': 'construction/multistorey-residential.webp',
    'page_13_img_9_133.jpeg': 'construction/building-supervision-site.webp',

    # Roads & Highways
    'page_14_img_1_137.jpeg': 'roads/sub-base-compaction-roller.webp',
    'page_14_img_2_138.jpeg': 'roads/highway-grading-works.webp',
    'page_14_img_3_139.jpeg': 'roads/asphalt-concrete-laying.webp',
    'page_14_img_4_140.jpeg': 'roads/paving-train-county-road.webp',
    'page_14_img_5_141.jpeg': 'roads/masonry-drainage-culverts.webp',

    # Water & Sanitation
    'page_15_img_1_145.jpeg': 'water/reservoir-treatment-tank.webp',
    'page_15_img_2_147.jpeg': 'water/pipe-jointing-reticulation.webp',
    'page_15_img_3_148.jpeg': 'water/trenching-pipeline-laying.webp',
    'page_15_img_4_149.jpeg': 'water/elevated-storage-tower.webp',

    # Mechanical Engineering
    'page_16_img_1_69.jpeg': 'mechanical/structural-steel-bulk-terminal.webp',
    'page_16_img_2_153.jpeg': 'mechanical/site-welding-qualified.webp',
    'page_16_img_3_154.jpeg': 'mechanical/pipework-fabrication.webp',
    'page_16_img_4_155.jpeg': 'mechanical/headframe-erection-assembly.webp',

    # Electrical & Instrumentation
    'page_17_img_1_159.jpeg': 'electrical/high-voltage-switchyard.webp',
    'page_17_img_2_160.jpeg': 'electrical/distribution-board-installation.webp',
    'page_17_img_3_161.jpeg': 'electrical/plant-control-panels.webp',
    'page_17_img_4_162.jpeg': 'electrical/testing-commissioning-multimeter.webp',

    # Energy & Petroleum
    'page_18_img_1_165.jpeg': 'energy/petroleum-lubricants-fluid.webp',
    'page_19_img_1_70.jpeg': 'energy/retail-forecourt-dispensing.webp',
    'page_19_img_3_175.jpeg': 'energy/bulk-fuel-road-transport.webp',
    'page_19_img_4_176.jpeg': 'energy/petroleum-depot-infrastructure.webp',

    # Timber & General Supplies
    'page_21_img_1_185.jpeg': 'timber/sawn-hardwood-timber-stock.webp',
    'page_21_img_2_186.jpeg': 'timber/graded-timber-stacks.webp',
    'page_21_img_3_187.jpeg': 'timber/container-discharge-timber.webp',
    'page_21_img_4_188.jpeg': 'timber/construction-hardwood-planks.webp',

    # Statutory Compliance Documents
    'page_24_img_1_199.jpeg': 'certifications/certificate-of-incorporation.webp',
    'page_24_img_2_200.jpeg': 'certifications/mineral-dealer-licence.webp',
    'page_24_img_3_201.jpeg': 'certifications/nema-environmental-approval.webp',

    # Projects
    'page_23_img_3_195.jpeg': 'projects/bondo-gold-processing-plant.webp',
}

for src_file, dest_file in image_map.items():
    process_image(src_file, dest_file)

# Also process the Google Photo as a hero/site background or project image
if os.path.exists('scratch/google_photo_1.jpg'):
    process_image('../google_photo_1.jpg', 'hero/mining-site-heavy-machinery.webp', target_max_dim=1600)
