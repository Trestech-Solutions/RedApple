import type { ProductData } from '@/components/product/ProductCard'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubCategory {
  id: string
  label: string
}

export interface Category {
  id: string
  label: string
  icon: string          // iconify icon key
  badge?: string
  /** Cart-section style identifier for items from this category (e.g. 'highlight'). */
  cartStyle?: string
  /** Category header style identifier (e.g. 'banner', 'minimal'). */
  headerStyle?: string
  subCategories: SubCategory[]
}

// Branch IDs — must match BranchInfo.id in OrderTypeModal
// '*' means available at all branches
export type BranchAvailability = string[] | '*'

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  {
    id: 'new-arrival',
    label: 'New Arrival',
    icon: 'solar:star-shine-bold-duotone',
    badge: 'NEW',
    subCategories: [
      { id: 'all-new', label: 'All New' },
      { id: 'ice-cream', label: 'Ice Cream' },
      { id: 'sweets', label: 'Sweets' },
    ],
  },
  {
    id: 'deals',
    label: 'Deals Treasure',
    icon: 'solar:gift-bold-duotone',
    subCategories: [
      { id: 'all-deals', label: 'All Deals' },
      { id: 'combo', label: 'Combo' },
      { id: 'family', label: 'Family Pack' },
    ],
  },
  {
    id: 'savories',
    label: 'Savories',
    icon: 'solar:flame-bold-duotone',
    subCategories: [
      { id: 'all-savories', label: 'All Savories' },
      { id: 'samosa', label: 'Samosa' },
      { id: 'rolls', label: 'Rolls' },
    ],
  },
  {
    id: 'mangoverse',
    label: 'MANGOVERSE',
    icon: 'solar:sun-bold-duotone',
    badge: 'HOT',
    subCategories: [
      { id: 'all-mango', label: 'All Mango' },
      { id: 'mango-ice-cream', label: 'Mango Ice Cream' },
      { id: 'mango-sweets', label: 'Mango Sweets' },
    ],
  },
  {
    id: 'fast-food',
    label: 'Fast Food & Deals',
    icon: 'solar:sun-bold-duotone',
    subCategories: [
      { id: 'all-fastfood', label: 'All Fast Food' },
      { id: 'burgers', label: 'Burgers' },
      { id: 'wraps', label: 'Wraps' },
    ],
  },
  {
    id: 'cakes',
    label: 'Cakes',
    icon: 'solar:gift-bold-duotone',
    subCategories: [
      { id: 'all-cakes', label: 'All Cakes' },
      { id: 'birthday', label: 'Birthday' },
      { id: 'premium', label: 'Premium' },
    ],
  },
  {
    id: 'sweets',
    label: 'Sweets',
    icon: 'solar:donut-bold-duotone',
    subCategories: [
      { id: 'all-sweets', label: 'All Sweets' },
      { id: 'barfi', label: 'Barfi' },
      { id: 'ladoo', label: 'Ladoo' },
    ],
  },
  {
    id: 'desserts',
    label: 'Desserts',
    icon: 'solar:cup-hot-bold-duotone',
    subCategories: [
      { id: 'all-desserts', label: 'All Desserts' },
      { id: 'kulfi', label: 'Kulfi' },
      { id: 'falooda', label: 'Falooda' },
    ],
  },
  {
    id: 'biscuits',
    label: 'Biscuits & Cookies',
    icon: 'solar:cup-paper-bold-duotone',
    subCategories: [
      { id: 'all-biscuits', label: 'All Biscuits' },
      { id: 'biscuits', label: 'Biscuits' },
      { id: 'cookies', label: 'Cookies' },
    ],
  },
  {
    id: 'gifts',
    label: 'Gift Essentials',
    icon: 'solar:gift-linear',
    subCategories: [
      { id: 'all-gifts', label: 'All Gifts' },
      { id: 'boxes', label: 'Gift Boxes' },
      { id: 'hampers', label: 'Hampers' },
    ],
  },
]

// ─── Products ─────────────────────────────────────────────────────────────────
// NOTE: `productId` uses 1000+ range to avoid conflicts with live API numeric IDs

type FallbackProduct = Omit<ProductData, 'productId'> & { productId?: number; categoryId: string; subCategoryId: string; branchIds: BranchAvailability }

export const ALL_PRODUCTS: FallbackProduct[] = [
  // ── New Arrival / Ice Cream ────────────────────────────────────────────────
  {
    id: 'kulfi-falooda',
    productId: 1001,
    categoryId: 'new-arrival',
    subCategoryId: 'ice-cream',
    branchIds: '*',
    name: 'Kulfi Falooda',
    description: 'Enjoy the authentic taste of Classic Plain Kulfi Falooda, rich, creamy, and perfectly chilled.',
    price: '1148',
    originalPrice: '1350',
    fromLabel: true,
    options: ['6 Pcs.', '12 Pcs.'],
    tag: 'New Arrival',
    discount: '15% OFF',
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'peshawari-ice-cream',
    productId: 1002,
    categoryId: 'new-arrival',
    subCategoryId: 'ice-cream',
    branchIds: ['gulshan-iqbal', 'maskan', 'dha', 'clifton', 'bahadurabad', 'karimabad'],
    name: 'Peshawari Ice Cream (475 ML)',
    description: 'Indulge in the rich and creamy delight of Peshawari Ice Cream, inspired by tradition.',
    price: '895',
    options: [],
    tag: 'New Arrival',
    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'kulfi-assorted',
    productId: 1003,
    categoryId: 'new-arrival',
    subCategoryId: 'ice-cream',
    branchIds: '*',
    name: 'Riwayati Kulfi - Assorted (6pcs)',
    description: 'A wide range of delicious kulfi flavours perfect for every occasion.',
    price: '1010',
    options: [],
    tag: 'New Arrival',
    image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'kulfi-malai-khoya',
    productId: 1004,
    categoryId: 'new-arrival',
    subCategoryId: 'ice-cream',
    branchIds: '*',
    name: 'Riwayati Kulfi - Malai Khoya',
    description: 'Malai Khoya kulfi, a popular choice to beat the summer heat.',
    price: '190',
    options: ['1 PC', '6 PCS'],
    image: 'https://images.unsplash.com/photo-1560801868-27a72fc9c47f?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'kulfi-mango',
    productId: 1005,
    categoryId: 'new-arrival',
    subCategoryId: 'ice-cream',
    branchIds: ['gulshan-iqbal', 'maskan', 'north-karachi', 'bahadurabad', 'sharfabad', 'karimabad'],
    name: 'Riwayati Kulfi - Mango',
    description: 'Mango Kulfi combining the richness of kulfi with fresh mango flavour.',
    price: '170',
    options: ['1 PC', '6 PCS'],
    image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'kulfi-pista',
    productId: 1006,
    categoryId: 'new-arrival',
    subCategoryId: 'ice-cream',
    branchIds: ['dha', 'clifton', 'gulshan-iqbal', 'bahadurabad', 'garden-east'],
    name: 'Riwayati Kulfi - Pista',
    description: 'Kulfi Pista Matki, sure to please your taste buds and leave you wanting more.',
    price: '170',
    options: ['1 PC', '6 PCS'],
    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=800&auto=format&fit=crop',
  },
  // ── New Arrival / Sweets ───────────────────────────────────────────────────
  {
    id: 'gulab-jamun',
    productId: 1007,
    categoryId: 'new-arrival',
    subCategoryId: 'sweets',
    branchIds: '*',
    name: 'Gulab Jamun (12 Pcs)',
    description: 'Soft, spongy gulab jamuns soaked in rose-flavoured sugar syrup.',
    price: '450',
    options: ['6 Pcs', '12 Pcs'],
    tag: 'New Arrival',
    image: 'https://images.unsplash.com/photo-1601303516534-a0e4c13b6e71?q=80&w=800&auto=format&fit=crop',
  },
  // ── Deals ─────────────────────────────────────────────────────────────────
  {
    id: 'deal-family-pack',
    productId: 1008,
    categoryId: 'deals',
    subCategoryId: 'family',
    branchIds: ['gulshan-iqbal', 'maskan', 'dha', 'clifton', 'bahadurabad', 'national-stadium'],
    name: 'Family Ice Cream Pack',
    description: 'A complete family pack with assorted ice cream flavours.',
    price: '2500',
    originalPrice: '3000',
    discount: '17% OFF',
    options: [],
    tag: 'Deal',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'deal-combo-1',
    productId: 1009,
    categoryId: 'deals',
    subCategoryId: 'combo',
    branchIds: '*',
    name: 'Combo Deal - 2 Kulfis + Falooda',
    description: 'Best value combo — 2 kulfis with a large falooda.',
    price: '650',
    originalPrice: '850',
    discount: '24% OFF',
    options: [],
    tag: 'Deal',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800&auto=format&fit=crop',
  },
  // ── MANGOVERSE ────────────────────────────────────────────────────────────
  {
    id: 'mango-kulfi',
    productId: 1010,
    categoryId: 'mangoverse',
    subCategoryId: 'mango-ice-cream',
    branchIds: ['gulshan-iqbal', 'maskan', 'dha', 'bahadurabad', 'clifton', 'sharfabad'],
    name: 'Aam Wala Kulfi',
    description: 'Pure mango kulfi made with fresh Sindhri mangoes.',
    price: '220',
    options: ['1 PC', '6 PCS'],
    tag: 'MANGOVERSE',
    image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'mango-barfi',
    productId: 1011,
    categoryId: 'mangoverse',
    subCategoryId: 'mango-sweets',
    branchIds: '*',
    name: 'Mango Barfi',
    description: 'Traditional barfi infused with the sweetness of ripe mangoes.',
    price: '380',
    options: ['250g', '500g'],
    tag: 'MANGOVERSE',
    image: 'https://images.unsplash.com/photo-1601303516534-a0e4c13b6e71?q=80&w=800&auto=format&fit=crop',
  },
  // ── Savories ──────────────────────────────────────────────────────────────
  {
    id: 'samosa-6',
    productId: 1012,
    categoryId: 'savories',
    subCategoryId: 'samosa',
    branchIds: '*',
    name: 'Crispy Samosa (6 Pcs)',
    description: 'Crispy golden samosas filled with spiced potato and peas.',
    price: '280',
    options: ['6 Pcs', '12 Pcs'],
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'spring-rolls',
    productId: 1013,
    categoryId: 'savories',
    subCategoryId: 'rolls',
    branchIds: ['gulshan-iqbal', 'dha', 'clifton', 'bahadurabad', 'north-nazimabad', 'maskan'],
    name: 'Chicken Spring Rolls (6 Pcs)',
    description: 'Crispy spring rolls stuffed with seasoned chicken and vegetables.',
    price: '320',
    options: ['6 Pcs', '12 Pcs'],
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
  },
  // ── Cakes ─────────────────────────────────────────────────────────────────
  {
    id: 'birthday-cake',
    productId: 1014,
    categoryId: 'cakes',
    subCategoryId: 'birthday',
    branchIds: '*',
    name: 'Classic Birthday Cake',
    description: 'Soft, moist vanilla sponge with fresh cream icing.',
    price: '1800',
    options: ['0.5 kg', '1 kg', '2 kg'],
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'premium-chocolate-cake',
    productId: 1015,
    categoryId: 'cakes',
    subCategoryId: 'premium',
    branchIds: ['dha', 'clifton', 'gulshan-iqbal', 'bahadurabad', 'maskan', 'national-stadium'],
    name: 'Premium Chocolate Truffle',
    description: 'Rich dark chocolate ganache layered over moist chocolate sponge.',
    price: '2800',
    originalPrice: '3200',
    discount: '12% OFF',
    options: ['1 kg', '2 kg'],
    tag: 'Premium',
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=800&auto=format&fit=crop',
  },
  // ── Sweets ────────────────────────────────────────────────────────────────
  {
    id: 'kaju-barfi',
    productId: 1016,
    categoryId: 'sweets',
    subCategoryId: 'barfi',
    branchIds: '*',
    name: 'Kaju Barfi (250g)',
    description: 'Premium cashew barfi, perfect for gifting and celebrations.',
    price: '650',
    options: ['250g', '500g', '1kg'],
    image: 'https://images.unsplash.com/photo-1601303516534-a0e4c13b6e71?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'motichoor-ladoo',
    productId: 1017,
    categoryId: 'sweets',
    subCategoryId: 'ladoo',
    branchIds: ['bahadurabad', 'karimabad', 'north-nazimabad', 'gulshan-iqbal', 'sharfabad'],
    name: 'Motichoor Ladoo (500g)',
    description: 'Soft, melt-in-the-mouth motichoor ladoos made fresh daily.',
    price: '480',
    options: ['250g', '500g'],
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=800&auto=format&fit=crop',
  },
  // ── Desserts ──────────────────────────────────────────────────────────────
  {
    id: 'falooda-classic',
    productId: 1018,
    categoryId: 'desserts',
    subCategoryId: 'falooda',
    branchIds: '*',
    name: 'Classic Falooda',
    description: 'Traditional falooda with vermicelli, basil seeds and rose syrup.',
    price: '290',
    options: ['Regular', 'Large'],
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'kulfi-regular',
    productId: 1019,
    categoryId: 'desserts',
    subCategoryId: 'kulfi',
    branchIds: '*',
    name: 'Malai Kulfi (1 PC)',
    description: 'Classic creamy malai kulfi, chilled to perfection.',
    price: '150',
    options: ['1 PC', '6 PCS'],
    image: 'https://images.unsplash.com/photo-1560801868-27a72fc9c47f?q=80&w=800&auto=format&fit=crop',
  },
  // ── Biscuits & Cookies ────────────────────────────────────────────────────
  {
    id: 'butter-cookies',
    productId: 1020,
    categoryId: 'biscuits',
    subCategoryId: 'cookies',
    branchIds: '*',
    name: 'Butter Cookies Box',
    description: 'Crisp, buttery cookies — perfect with tea.',
    price: '350',
    options: ['200g', '400g'],
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'chocolate-biscuits',
    productId: 1021,
    categoryId: 'biscuits',
    subCategoryId: 'biscuits',
    branchIds: ['gulshan-iqbal', 'dha', 'clifton', 'bahadurabad', 'maskan'],
    name: 'Chocolate Biscuits (Pack of 12)',
    description: 'Rich cocoa biscuits with a smooth chocolate coat.',
    price: '280',
    options: [],
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800&auto=format&fit=crop',
  },
  // ── Gift Essentials ───────────────────────────────────────────────────────
  {
    id: 'gift-box-premium',
    productId: 1022,
    categoryId: 'gifts',
    subCategoryId: 'boxes',
    branchIds: ['dha', 'clifton', 'gulshan-iqbal', 'bahadurabad', 'national-stadium', 'maskan'],
    name: 'Premium Mithai Gift Box',
    description: 'A curated selection of premium sweets in a beautiful gift box.',
    price: '1200',
    options: ['Small', 'Medium', 'Large'],
    tag: 'Gift',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'gift-hamper',
    productId: 1023,
    categoryId: 'gifts',
    subCategoryId: 'hampers',
    branchIds: '*',
    name: 'Eid Special Hamper',
    description: 'Festive hamper with sweets, biscuits and dry fruits.',
    price: '2200',
    originalPrice: '2600',
    discount: '15% OFF',
    options: [],
    tag: 'Gift',
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=800&auto=format&fit=crop',
  },
]
