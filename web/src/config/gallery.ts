/**
 * Gallery manifest — the photographs shown on /gallery.
 *
 * Populated from the site's existing project photography. To replace or
 * extend this set with the Pixieset originals, drop them into
 *   web/public/images/gallery/_source/<Category>/…
 * and run `node web/scripts/convert-gallery.mjs`, which will regenerate
 * this file with the new .webp entries.
 */

export interface GalleryImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  category?: string;
}

export const galleryImages: GalleryImage[] = [
  {
    "src": "/images/mining/ball-mill-installation-bondo.webp",
    "width": 1024,
    "height": 576,
    "alt": "Ball Mill Installation Bondo — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/centrifugal-concentrators.webp",
    "width": 1000,
    "height": 750,
    "alt": "Centrifugal Concentrators — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/drilling-rig-mast.webp",
    "width": 355,
    "height": 1200,
    "alt": "Drilling Rig Mast — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/gold-nuggets-raw.webp",
    "width": 765,
    "height": 573,
    "alt": "Gold Nuggets Raw — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/gold-ore-specimen.webp",
    "width": 720,
    "height": 405,
    "alt": "Gold Ore Specimen — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/gravity-sluice-table.webp",
    "width": 473,
    "height": 354,
    "alt": "Gravity Sluice Table — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/leach-cil-tank-construction.webp",
    "width": 900,
    "height": 675,
    "alt": "Leach Cil Tank Construction — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/lolgorian-gold-mine-shaft.webp",
    "width": 1376,
    "height": 768,
    "alt": "Lolgorian Gold Mine Shaft — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/oyugis-gold-mining-site.webp",
    "width": 1376,
    "height": 768,
    "alt": "Oyugis Gold Mining Site — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/poured-dore-bar-bondo.webp",
    "width": 810,
    "height": 607,
    "alt": "Poured Dore Bar Bondo — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/production-weighed-digital-scale.webp",
    "width": 589,
    "height": 616,
    "alt": "Production Weighed Digital Scale — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/mining/shaft-hoisting-gear.webp",
    "width": 739,
    "height": 554,
    "alt": "Shaft Hoisting Gear — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/projects/bondo-gold-processing-plant.webp",
    "width": 1024,
    "height": 768,
    "alt": "Bondo Gold Processing Plant — Green Ngoria Supplies Limited",
    "category": "Gold mining & processing"
  },
  {
    "src": "/images/engineering/mining-equipment-machinery-bay.webp",
    "width": 1376,
    "height": 768,
    "alt": "Mining Equipment Machinery Bay — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/engineering/mining-spares-wear-parts.webp",
    "width": 1376,
    "height": 768,
    "alt": "Mining Spares Wear Parts — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/engineering/plant-construction-crane-site.webp",
    "width": 1376,
    "height": 768,
    "alt": "Plant Construction Crane Site — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/engineering/plant-engineering-3d-cad.webp",
    "width": 1376,
    "height": 768,
    "alt": "Plant Engineering 3d Cad — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/engineering/plant-optimization-kinetics-lab.webp",
    "width": 1376,
    "height": 768,
    "alt": "Plant Optimization Kinetics Lab — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/mechanical/headframe-erection-assembly.webp",
    "width": 426,
    "height": 320,
    "alt": "Headframe Erection Assembly — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/mechanical/pipework-fabrication.webp",
    "width": 387,
    "height": 290,
    "alt": "Pipework Fabrication — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/mechanical/site-welding-qualified.webp",
    "width": 456,
    "height": 256,
    "alt": "Site Welding Qualified — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/mechanical/structural-steel-bulk-terminal.webp",
    "width": 1200,
    "height": 674,
    "alt": "Structural Steel Bulk Terminal — Green Ngoria Supplies Limited",
    "category": "Plant & engineering"
  },
  {
    "src": "/images/electrical/distribution-board-installation.webp",
    "width": 929,
    "height": 522,
    "alt": "Distribution Board Installation — Green Ngoria Supplies Limited",
    "category": "Electrical & controls"
  },
  {
    "src": "/images/electrical/high-voltage-switchyard.webp",
    "width": 645,
    "height": 860,
    "alt": "High Voltage Switchyard — Green Ngoria Supplies Limited",
    "category": "Electrical & controls"
  },
  {
    "src": "/images/electrical/plant-control-panels.webp",
    "width": 549,
    "height": 412,
    "alt": "Plant Control Panels — Green Ngoria Supplies Limited",
    "category": "Electrical & controls"
  },
  {
    "src": "/images/electrical/testing-commissioning-multimeter.webp",
    "width": 679,
    "height": 509,
    "alt": "Testing Commissioning Multimeter — Green Ngoria Supplies Limited",
    "category": "Electrical & controls"
  },
  {
    "src": "/images/construction/building-supervision-site.webp",
    "width": 720,
    "height": 540,
    "alt": "Building Supervision Site — Green Ngoria Supplies Limited",
    "category": "Construction"
  },
  {
    "src": "/images/construction/commercial-property-nairobi.webp",
    "width": 480,
    "height": 360,
    "alt": "Commercial Property Nairobi — Green Ngoria Supplies Limited",
    "category": "Construction"
  },
  {
    "src": "/images/construction/grand-park-complex.webp",
    "width": 1200,
    "height": 675,
    "alt": "Grand Park Complex — Green Ngoria Supplies Limited",
    "category": "Construction"
  },
  {
    "src": "/images/construction/institutional-building-project.webp",
    "width": 480,
    "height": 360,
    "alt": "Institutional Building Project — Green Ngoria Supplies Limited",
    "category": "Construction"
  },
  {
    "src": "/images/construction/multistorey-residential.webp",
    "width": 720,
    "height": 540,
    "alt": "Multistorey Residential — Green Ngoria Supplies Limited",
    "category": "Construction"
  },
  {
    "src": "/images/construction/renovation-architectural-finishes.webp",
    "width": 1376,
    "height": 768,
    "alt": "Renovation Architectural Finishes — Green Ngoria Supplies Limited",
    "category": "Construction"
  },
  {
    "src": "/images/construction/residential-villa-design-build.webp",
    "width": 1200,
    "height": 674,
    "alt": "Residential Villa Design Build — Green Ngoria Supplies Limited",
    "category": "Construction"
  },
  {
    "src": "/images/roads/asphalt-concrete-laying.webp",
    "width": 541,
    "height": 406,
    "alt": "Asphalt Concrete Laying — Green Ngoria Supplies Limited",
    "category": "Roads & civils"
  },
  {
    "src": "/images/roads/highway-grading-works.webp",
    "width": 720,
    "height": 405,
    "alt": "Highway Grading Works — Green Ngoria Supplies Limited",
    "category": "Roads & civils"
  },
  {
    "src": "/images/roads/masonry-drainage-culverts.webp",
    "width": 541,
    "height": 721,
    "alt": "Masonry Drainage Culverts — Green Ngoria Supplies Limited",
    "category": "Roads & civils"
  },
  {
    "src": "/images/roads/paving-train-county-road.webp",
    "width": 541,
    "height": 406,
    "alt": "Paving Train County Road — Green Ngoria Supplies Limited",
    "category": "Roads & civils"
  },
  {
    "src": "/images/roads/sub-base-compaction-roller.webp",
    "width": 720,
    "height": 405,
    "alt": "Sub Base Compaction Roller — Green Ngoria Supplies Limited",
    "category": "Roads & civils"
  },
  {
    "src": "/images/water/elevated-storage-tower.webp",
    "width": 310,
    "height": 414,
    "alt": "Elevated Storage Tower — Green Ngoria Supplies Limited",
    "category": "Water infrastructure"
  },
  {
    "src": "/images/water/pipe-jointing-reticulation.webp",
    "width": 429,
    "height": 321,
    "alt": "Pipe Jointing Reticulation — Green Ngoria Supplies Limited",
    "category": "Water infrastructure"
  },
  {
    "src": "/images/water/reservoir-treatment-tank.webp",
    "width": 768,
    "height": 576,
    "alt": "Reservoir Treatment Tank — Green Ngoria Supplies Limited",
    "category": "Water infrastructure"
  },
  {
    "src": "/images/water/trenching-pipeline-laying.webp",
    "width": 453,
    "height": 339,
    "alt": "Trenching Pipeline Laying — Green Ngoria Supplies Limited",
    "category": "Water infrastructure"
  },
  {
    "src": "/images/energy/bulk-fuel-road-transport.webp",
    "width": 820,
    "height": 615,
    "alt": "Bulk Fuel Road Transport — Green Ngoria Supplies Limited",
    "category": "Petroleum & energy"
  },
  {
    "src": "/images/energy/petroleum-depot-infrastructure.webp",
    "width": 824,
    "height": 618,
    "alt": "Petroleum Depot Infrastructure — Green Ngoria Supplies Limited",
    "category": "Petroleum & energy"
  },
  {
    "src": "/images/energy/petroleum-lubricants-fluid.webp",
    "width": 822,
    "height": 616,
    "alt": "Petroleum Lubricants Fluid — Green Ngoria Supplies Limited",
    "category": "Petroleum & energy"
  },
  {
    "src": "/images/energy/retail-forecourt-dispensing.webp",
    "width": 712,
    "height": 949,
    "alt": "Retail Forecourt Dispensing — Green Ngoria Supplies Limited",
    "category": "Petroleum & energy"
  },
  {
    "src": "/images/timber/construction-hardwood-planks.webp",
    "width": 768,
    "height": 432,
    "alt": "Construction Hardwood Planks — Green Ngoria Supplies Limited",
    "category": "Timber & materials"
  },
  {
    "src": "/images/timber/container-discharge-timber.webp",
    "width": 715,
    "height": 536,
    "alt": "Container Discharge Timber — Green Ngoria Supplies Limited",
    "category": "Timber & materials"
  },
  {
    "src": "/images/timber/graded-timber-stacks.webp",
    "width": 586,
    "height": 439,
    "alt": "Graded Timber Stacks — Green Ngoria Supplies Limited",
    "category": "Timber & materials"
  },
  {
    "src": "/images/timber/sawn-hardwood-timber-stock.webp",
    "width": 653,
    "height": 490,
    "alt": "Sawn Hardwood Timber Stock — Green Ngoria Supplies Limited",
    "category": "Timber & materials"
  },
  {
    "src": "/images/gemstones/cut-blue-sapphire.webp",
    "width": 469,
    "height": 351,
    "alt": "Cut Blue Sapphire — Green Ngoria Supplies Limited",
    "category": "Gemstones"
  },
  {
    "src": "/images/gemstones/cut-tanzanite-parcel.webp",
    "width": 600,
    "height": 450,
    "alt": "Cut Tanzanite Parcel — Green Ngoria Supplies Limited",
    "category": "Gemstones"
  },
  {
    "src": "/images/gemstones/green-tsavorite-rough.webp",
    "width": 720,
    "height": 540,
    "alt": "Green Tsavorite Rough — Green Ngoria Supplies Limited",
    "category": "Gemstones"
  },
  {
    "src": "/images/gemstones/ruby-in-matrix.webp",
    "width": 635,
    "height": 476,
    "alt": "Ruby In Matrix — Green Ngoria Supplies Limited",
    "category": "Gemstones"
  },
  {
    "src": "/images/gemstones/tanzanite-rough-crystal.webp",
    "width": 670,
    "height": 502,
    "alt": "Tanzanite Rough Crystal — Green Ngoria Supplies Limited",
    "category": "Gemstones"
  }
];
