// ─── Shared pagination wrapper (DRF PageNumberPagination) ────────────────────

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// ─── Common query params supported by all list endpoints ─────────────────────

export type ListParams = {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};

// ─── Common DRF error shape ───────────────────────────────────────────────────

export type ApiError = {
  detail?: string;
  [key: string]: unknown;
};

export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as ApiError;
    if (typeof e.detail === "string") return e.detail;
    const firstField = Object.values(e)[0];
    if (Array.isArray(firstField)) return firstField[0] as string;
    if (typeof firstField === "string") return firstField;
  }
  return "Something went wrong. Please try again.";
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: number | null;
  role_name: string | null;
  group: number | null;
  group_name: string | null;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  created_at: string;
  updated_at: string;
};

export type CreateUserPayload = {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: number | null;
  group?: number | null;
  password: string;
  password_confirm: string;
};

export type UpdateUserPayload = {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: number | null;
  group?: number | null;
  is_active?: boolean;
  password?: string;
};

export type UsersListParams = ListParams & {
  is_active?: boolean;
  role?: number;
  group?: number;
};

// ─── Role ─────────────────────────────────────────────────────────────────────

export type Role = {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateRolePayload = {
  name: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
};

export type UpdateRolePayload = Partial<CreateRolePayload>;

export type RolesListParams = ListParams & {
  is_active?: boolean;
};

// ─── Group ────────────────────────────────────────────────────────────────────

export type Group = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateGroupPayload = {
  name: string;
  description?: string;
  is_active?: boolean;
};

export type UpdateGroupPayload = Partial<CreateGroupPayload>;

export type GroupsListParams = ListParams & {
  is_active?: boolean;
};

// ─── Restaurant ───────────────────────────────────────────────────────────────

export type Restaurant = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  owner: number | null;
  owner_username: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateRestaurantPayload = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  owner?: number | null;
  is_active?: boolean;
};

export type UpdateRestaurantPayload = Partial<CreateRestaurantPayload>;

export type RestaurantsListParams = ListParams & {
  is_active?: boolean;
  city?: string;
};

// ─── Storefront Browse ───────────────────────────────────────────────────────

export type StoreSettings = {
  id: number
  date_added?: string
  date_updated?: string
  created_by?: number
  updated_by?: number
  restaurant?: number

  // Branding / visuals
  merchant_logo?: string | null
  menu_header?: string
  phone_icon_type?: 'none' | 'call' | 'whatsapp' | string
  logo_left_align?: boolean
  hide_phone_from_header?: boolean
  show_navbar?: boolean
  logo_fit_to_navbar?: boolean
  logo_link?: string
  location_link?: string
  navbar_color?: string
  merchant_header_background?: string
  foreground_color?: string
  background_color?: string
  menu_page_background_color?: string
  menu_page_background_image?: string | null
  menu_font_family?: string
  item_price_background?: string
  item_price_text_color?: string
  item_price_border_color?: string
  price_rounder_center?: boolean
  category_navbar_background_color?: string
  // Product card design variant
  product_card_design?: 'card-1' | 'card-2' | 'card-3'
  // Category nav design variant
  category_design?: 'category-1' | 'category-2' | 'category-3'
  // Order/Location modal design: 'modal-1' = existing (dropdown cities), 'modal-2' = image city cards
  order_modal_design?: 'modal-1' | 'modal-2'

  // Android / iOS app
  android_icon?: string | null
  android_app_link?: string
  ios_icon?: string | null
  ios_app_link?: string

  // Hero slides (up to 4)
  slide_image_1?: string | null
  heading_text_1?: string
  heading_color_1?: string
  description_text_1?: string
  description_color_1?: string
  slide_link_1?: string
  slide_image_2?: string | null
  heading_text_2?: string
  heading_color_2?: string
  description_text_2?: string
  description_color_2?: string
  slide_link_2?: string
  slide_image_3?: string | null
  heading_text_3?: string
  heading_color_3?: string
  description_text_3?: string
  description_color_3?: string
  slide_link_3?: string
  slide_image_4?: string | null
  heading_text_4?: string
  heading_color_4?: string
  description_text_4?: string
  description_color_4?: string
  slide_link_4?: string

  // UI toggles
  show_cart_icon?: boolean
  show_stack_tag_on_item?: boolean
  stack_tag_background_color?: string
  stack_tag_color?: string
  discount_background_color?: string
  discount_text_color?: string
  enable_user_login?: boolean
  enable_auto_location?: boolean
  set_full_width_menu?: boolean
  hide_payment_card_logo_from_banner?: boolean
  enable_branch_on_delivery?: boolean
  change_area_filter_option?: boolean
  price_inclusive_tax?: boolean
  sum_discount_in_minimum_order_amount?: boolean
  add_estimation_time_in_initial_time?: boolean
  enable_number_field_in_area_modal?: boolean
  enable_grid_view_receipt?: boolean
  enable_city_wise_order_mapping?: boolean
  discount_ordering?: boolean
  enable_nearest_landmark_required?: boolean
  enable_order_sms_verification?: boolean
  enable_customer_sms_verification?: boolean
  disable_change_branch_option?: boolean
  enable_round_logo_of_location_modal?: boolean
  auto_selection_of_addon_quantity?: boolean
  quick_add_to_cart_with_description?: boolean
  show_view_all_categories_floating_popup?: boolean
  hide_delivery_time?: boolean
  hide_set_delivery_time?: boolean
  // Checkout field visibility
  hide_alternative_number?: boolean
  hide_delivery_instructions?: boolean
  hide_nearest_landmark?: boolean
  hide_email_address?: boolean
  hide_thanks_page_animation?: boolean
  accept_pre_orders?: boolean
  same_message_for_all_holidays?: boolean
  load_menu_in_chunks?: boolean
  preload_caching?: boolean
  branch_wise_settings?: boolean
  packaging_incremental?: boolean
  do_not_apply_tax_to_delivery_charges?: boolean

  if_item_not_available?: 'hide' | 'show_disabled' | string

  // Pricing & charges
  tax_number?: string
  free_delivery_above_subtotal?: string | number | null
  close_store?: boolean
  convenience_fee?: string | number | null
  checkout_note?: string
  enable_city_on_checkout?: boolean
  // min / max purchase amount per order type (empty string = not set)
  delivery_minimum_purchase_amount?: string | number | null
  delivery_maximum_purchase_amount?: string | number | null
  dinein_minimum_purchase_amount?: string | number | null
  dinein_maximum_purchase_amount?: string | number | null
  pickup_minimum_purchase_amount?: string | number | null
  pickup_maximum_purchase_amount?: string | number | null
  packaging_charge?: string | number | null
  delivery_charges?: string | number | null
  customer_can_request_sms_code_every?: string

  // Estimated delivery times (minutes)
  delivery_time?: string | number | null
  dinein_time?: string | number | null
  pickup_time?: string | number | null

  // Per-order-type messages (global / regular ordering)
  message_for_delivery?: string
  message_for_dinein?: string
  message_for_pickup?: string

  // Close messages
  close_message?: string
  holiday_close_message?: string

  // ─── Branch-level settings overrides ──────────────────────────────────────

  branch?: number | null

  enable_save_my_info?: boolean

  // General / always preorder
  days_forward_for_always_preorder?: number | null
  message_for_always_preorder?: string
  time_slot_difference_minutes?: number | null

  // Delivery (Regular Ordering) — order-type specific per mode
  delivery_delivery_time?: string | number | null
  delivery_pickup_time?: string | number | null
  delivery_dinein_time?: string | number | null
  delivery_minimum_order?: string | number | null
  delivery_message_for_delivery?: string
  delivery_message_for_pickup?: string
  delivery_message_for_dinein?: string
  delivery_message_instruction?: string

  // Preorder (Scheduled Ahead)
  preorder_delivery_time?: string | number | null
  preorder_pickup_time?: string | number | null
  preorder_dinein_time?: string | number | null
  preorder_minimum_order?: string | number | null
  preorder_message_for_delivery?: string
  preorder_message_for_pickup?: string
  preorder_message_for_dinein?: string
  preorder_message_instruction?: string

  // Discount toggles
  apply_offer_discount_as_on_web_ordering?: boolean
  apply_item_wise_discount_as_on_web_ordering?: boolean

  // Exclusions
  excluded_categories?: number[]
  excluded_items?: number[]
}

export type Branch = {
  id: number;
  name?: string;
  branch_name?: string;
  address?: string;
  location?: string;
  city?: string;
  phone?: string;
  latitude?: string | null;
  longitude?: string | null;
  map_location?: string | null;
  is_active?: boolean;
  status?: boolean;
  opening_time?: string | null;
  closing_time?: string | null;
  pickup_status?: boolean;
  delivery_status?: boolean;
  is_default?: boolean;
  restaurant?: number;
  created_at?: string;
  updated_at?: string;
};

export type City = {
  id: number;
  name: string;
  status?: boolean;
  branch?: number;
  branch_id?: number;
  branch_name?: string | null;
  image?: string | null;       // city landmark/icon image
  latitude?: string | null;
  longitude?: string | null;
  radius_km?: string | null;
};

export type Area = {
  id: number;
  name: string;
  city?: number;            // Legacy: FK to City (per list response)
  city_id?: number;         // New: FK to City (storefront detail API)
  city_name?: string;       // Legacy: read-only per list response
  branch?: number;          // Legacy: FK to Branch
  branch_id?: number;       // New storefront detail/list API: FK to Branch
  branch_name?: string;     // Legacy: read-only per list response
  status?: boolean;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radius_km?: number | string | null;
  is_active?: boolean;
  created_by?: number;
  created_by_username?: string;
  updated_by?: number;
  updated_by_username?: string;
  date_added?: string;
  date_updated?: string;
  created_at?: string;    // legacy
  updated_at?: string;    // legacy
};

/** Shape returned by GET /storefront/branches/by-city/?cityId=<id> */
export type BranchByCity = {
  branchId: number;
  name: string;
};

export type LocateResponse = {
  success: boolean;
  city_id?: number;
  city_name?: string;
  branch_id?: number;
  area_id?: number | null;
  area_name?: string | null;
};

// ─── Menu types — matches actual API response ────────────────────────────────

/**
 * A size-level price record as returned by ItemSerializer.size_prices[].
 * Each item may have multiple sizes (Regular/Large etc.) each with its own
 * price, discount value and discount type.
 */
export type SizePrice = {
  id: number;                    // PK of ItemSizePrice — send as `variant` to cart
  size: number;                  // FK to Size (id)
  size_name: string;             // Human readable size (e.g. "Large")
  price: string;                 // Current / effective price for this size (after discount)
  discount: string | null;       // Discount value — semantics depend on discount_type
  discount_type: 'fixed' | 'percent' | string | null;
};

/**
 * An Item object as returned by the menu endpoint (via ItemSerializer +
 * price_at_branch injection). These are the records to pass as `item` to
 * POST /storefront/cart/items/.
 */
export type MenuItem = {
  id: number;
  restaurant?: number;
  item_sku?: string;
  name: string;
  description?: string | null;
  time_duration?: string | null;
  status?: boolean | number;
  feature_image?: string | null;  // product image
  front_price?: string;           // base price
  price_at_branch?: string;       // branch-overridden price (injected by MenuView)
  item_discount?: string | null;
  item_discount_type?: string | null;
  show_discount_tag?: boolean;
  is_popular?: boolean;           // flagged as popular item (max 4 per restaurant)
  branch_prices?: unknown[];
  size_prices?: SizePrice[];
  date_added?: string;
  date_updated?: string;
};

/**
 * A "Dish" — category grouping label linked via M2M. NOT the same as Item.
 * These appear in dish_detail[] and are NOT valid cart item IDs.
 */
export type MenuDish = {
  id: number;
  restaurant?: number;
  name: string;
  description?: string | null;
  status?: boolean;
  // Legacy/compat fields — may be absent
  base_price?: string | null;
  original_price?: string | null;
  image?: string | null;
  tag?: string | null;
  discount?: string | null;
  slug?: string;
  from_label?: boolean;
  branch_ids?: (string | number)[] | '*';
  options?: ProductOption[];
  created_by?: number;
  updated_by?: number;
  date_added?: string;
  date_updated?: string;
};

export type MenuCategory = {
  id: number;
  restaurant?: number;
  name: string;
  description?: string | null;
  banner?: string | null;
  icon?: string | null;
  badge?: string | null;
  status?: boolean;
  is_active?: boolean;
  sort_order?: number;
  // ── ACTUAL API FIELDS ──────────────────────────────────────────────────────
  // items[] = Item objects (injected by MenuView) — use these IDs for cart
  items?: MenuItem[];
  // dish[] / dish_detail[] = Dish M2M (grouping labels, NOT cart-compatible)
  dish?: number[];
  dish_detail?: MenuDish[];
  // ── Legacy sub-category shape ──────────────────────────────────────────────
  sub_categories?: MenuSubCategory[];
  // Display flags
  hide_category?: boolean;
  hide_category_from_navbar?: boolean;
  hide_category_display_name_menu?: boolean;
  layout?: string;
  date_added?: string;
  date_updated?: string;
};

/** Legacy sub-category shape — kept for backward compat */
export type MenuSubCategory = {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
  products?: Product[];
};

/** Legacy full product type (older API) */
export type Product = {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  base_price: string;
  original_price?: string | null;
  from_label?: boolean;
  image?: string | null;
  tag?: string | null;
  discount?: string | null;
  branch_ids?: (string | number)[] | '*';
  options: ProductOption[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductOption = {
  id: number;
  name: string;
  price_adjustment?: string | number;
};

export type MenuSize = {
  id: number;
  restaurant: number;
  name: string;
  description?: string | null;
  status?: boolean;
};

export type MenuAddonCategory = {
  id: number;
  restaurant: number;
  name: string;
  description?: string | null;
  status?: boolean;
  addons?: unknown[];
};

export type MenuResponse = {
  branch:           Branch;
  area:             Area | null;
  settings:         StoreSettings;
  branch_settings:  Partial<StoreSettings>;
  business_hours:   unknown[];
  sizes:            MenuSize[];
  addon_categories: MenuAddonCategory[];
  // Actual API returns `menu` array of categories
  menu:             MenuCategory[];
  // Deals — injected at top-level alongside menu
  fixed_deals?:    MenuFixedDeal[];
  on_spot_deals?:  MenuOnSpotDeal[];
  // Popular items (up to 4, flagged with is_popular=true, branch-filtered)
  popular_items?:  MenuItem[];
  // Branch-wise promotional banners (shown in hero carousel)
  banners?:        MenuBanner[];
  // Social media links
  social_media_links?: {
    facebook_link:  string;
    instagram_link: string;
    twitter_link:   string;
    youtube_link:   string;
    tiktok_link:    string;
    linkedin_link:  string;
    snapchat_link:  string;
    pinterest_link: string;
    whatsapp_link:  string;
  };
  // Legacy fallback
  categories?:      MenuCategory[];
};

// ─── Storefront Deal types (as returned inside menu response) ─────────────────

/** Shape of a single FoodAddon as returned in available_addons_detail[]. */
export type MenuAddonDetail = {
  id: number;
  addon_category: number;
  addon_category_name: string;
  name: string;
  description?: string;
  price: string;
  photo?: string | null;
  status: boolean;
};

export type MenuDealItemDetail = {
  id: number;
  item: number;
  item_detail?: MenuItem;
  quantity: number;
  extra_cost?: string;                    // decimal — extra charge on top of deal price
  available_addons?: number[];            // write: list of addon IDs
  available_addons_detail?: MenuAddonDetail[]; // read: expanded addon objects
};

/** An add-on option within an addon_items group. */
export type MenuOnSpotDealGroupAddonOption = {
  id: null;
  item: null;
  item_detail: null;
  addon: number;
  addon_detail: {
    id: number;
    addon_category: number;
    addon_category_name: string;
    name: string;
    description?: string;
    price: string;
    photo?: string | null;
    status: boolean;
  };
  quantity: number;       // per-pick quantity (how many of this item per selection)
  max_quantity: number | null;  // max times this option can be picked (null = group cap only)
};

/** A normal_dish option within a normal_dish group. */
export type MenuOnSpotDealGroupItemOption = {
  id: number;
  item: number;
  item_detail?: MenuItem;
  quantity: number;       // per-pick quantity
  max_quantity: number | null;
  extra_cost?: string;                    // decimal — extra charge on top of deal price
  available_addons?: number[];            // write: list of addon IDs
  available_addons_detail?: MenuAddonDetail[]; // read: expanded addon objects
};

export type MenuOnSpotDealGroupOption =
  | MenuOnSpotDealGroupAddonOption
  | MenuOnSpotDealGroupItemOption;

export type MenuOnSpotDealGroup = {
  id: number;
  name: string;
  group_type: 'normal_dish' | 'addon_items';
  is_required: boolean;
  select_quantity: number;
  addon_category: number | null;
  addon_category_detail: {
    id: number;
    name: string;
    description?: string;
    status: boolean;
  } | null;
  options: MenuOnSpotDealGroupOption[];
};

/** Branch-wise banner as returned inside the menu endpoint response. */
export type MenuBanner = {
  id: number;
  title: string;
  url: string;
  banner_image: string | null;
  status: boolean;
  valid_from_date: string | null;
  valid_to_date: string | null;
  start_time: string | null;
  end_time: string | null;
  /** true if the current local time falls within the daily time window (if set). */
  is_available_now: boolean;
};

/** Shape of a Fixed Deal as returned inside the menu endpoint response. */
export type MenuFixedDeal = {
  id: number;
  restaurant: number;
  category: number | null;         // FK — which menu category this deal belongs to
  category_detail?: MenuCategory | null;
  name: string;
  description?: string | null;
  feature_image?: string | null;   // field name is feature_image (not image)
  price: string;
  discount?: string;
  discount_type?: 'fixed' | 'percentage';
  final_price: string;
  items_detail?: MenuDealItemDetail[];
  valid_from_date?: string | null;
  valid_to_date?: string | null;
  start_time?: string | null;      // "HH:MM:SS" — time window filter (PKT)
  end_time?: string | null;        // "HH:MM:SS" — time window filter (PKT)
  status: boolean | number;        // API returns 1/0 or true/false
  is_available_now?: boolean;
};

/** Shape of an On Spot Deal as returned inside the menu endpoint response. */
export type MenuOnSpotDeal = {
  id: number;
  restaurant: number;
  category: number | null;         // FK — which menu category this deal belongs to
  category_detail?: MenuCategory | null;
  name: string;
  description?: string | null;
  feature_image?: string | null;   // field name is feature_image (not image)
  price: string;
  discount?: string;
  discount_type?: 'fixed' | 'percentage';
  final_price: string;
  items_detail?: MenuDealItemDetail[];
  groups_detail?: MenuOnSpotDealGroup[];
  valid_from_date?: string | null;
  valid_to_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: boolean | number;        // API returns 1/0 or true/false
  is_available_now?: boolean;
};

// ─── Storefront Cart ─────────────────────────────────────────────────────────

export type CartItem = {
  id: number;
  cart: number;
  item: number;              // backend field name (was `product`)
  item_name: string;         // backend field name (was `product_name`)
  size?: number | null;
  size_detail?: { id: number; name: string } | null;
  quantity: number;
  notes?: string;
  unit_price: string;
  line_total: string;
  addons?: { id: number; addon: number; quantity: number }[];
};

export type Cart = {
  id: number;
  token: string;
  branch: number;
  area?: number | null;
  items: CartItem[];
  subtotal: string;
  created_at?: string;
  updated_at?: string;
};

export type AddCartItemPayload = {
  item: number;           // backend field name (was `product`)
  branch: number;         // required by backend
  quantity: number;
  size?: number;          // optional size ID (was `variant`)
  notes?: string;         // optional (was `special_instructions`)
  addons?: { addon: number; quantity?: number }[];
  cart_token?: string;
  area?: number;
};

export type UpdateCartItemPayload = {
  quantity: number;
};

// ─── Storefront Order Create ──────────────────────────────────────────────────
// POST /api/storefront/orders/
// No cart/checkout steps — everything in one shot.

export type OrderCreateAddon = {
  addon: number;
  quantity?: number;
};

export type OrderCreateGroupSelection = {
  group: number;           // OnSpotDealGroup.id
  options: number[];       // list of item_id or addon_id depending on group_type
};

/** One line in the order. type defaults to "item" if omitted. */
export type OrderCreateLine =
  | {
      type?: 'item';
      item: number;
      size?: number | null;
      quantity?: number;
      notes?: string;
      addons?: OrderCreateAddon[];
    }
  | {
      type: 'fixed_deal';
      deal: number;
      quantity?: number;
      notes?: string;
    }
  | {
      type: 'on_spot_deal';
      deal: number;
      quantity?: number;
      notes?: string;
      selections?: OrderCreateGroupSelection[];
    };

/** Full one-shot order payload matching OrderCreateSerializer. */
export type OrderCreatePayload = {
  branch: number;
  area?: number | null;
  order_type: 'delivery' | 'pickup' | 'dinein';
  customer_name: string;
  customer_phone: string;
  customer_city?: string;
  customer_address?: string;
  customer_landmark?: string;
  customer_instructions?: string;
  items: OrderCreateLine[];
};

/** Keep old name as alias so existing imports don't break immediately. */
export type CheckoutPayload = OrderCreatePayload;

export type OrderItemAddon = {
  id: number;
  addon: number;
  addon_name: string;
  unit_price: string;
  quantity: number;
};

export type OrderItemComponent = {
  id: number;
  component_type: string;
  group_name: string;
  item: number | null;
  addon: number | null;
  item_name: string;
  quantity: number;
};

export type OrderItem = {
  id: number;
  line_type: string;           // "item" | "fixed_deal" | "on_spot_deal"
  item: number | null;
  fixed_deal: number | null;
  on_spot_deal: number | null;
  item_name: string;
  size?: number | null;
  size_name?: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  notes?: string;
  addons: OrderItemAddon[];
  components: OrderItemComponent[];
};

export type Order = {
  id: number;
  restaurant: number;
  branch: number;
  branch_name?: string;
  area?: number | null;
  customer?: number | null;
  order_type: 'delivery' | 'pickup' | 'dinein';
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_city?: string;
  customer_address?: string;
  customer_landmark?: string;
  customer_instructions?: string;
  subtotal: string;
  delivery_charge: string;
  packaging_charge: string;
  discount_total: string;
  grand_total: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type CheckoutResponse = Order;

// ─── Storefront Customer Auth & Profile ──────────────────────────────────────

// ─── Customer Registration (matches CustomerRegisterSerializer) ───────────────
// Backend fields: restaurant (id), name, phone, email?, password, password_confirm

export type RegisterPayload = {
  restaurant: number;      // required — FK to Restaurant
  name: string;            // required — customer display name
  phone: string;           // required — unique per restaurant
  email?: string;          // optional
  password: string;        // required — min 8 chars (Django validator)
  password_confirm: string;// required — must match password
};

// Backend register/login response: { access, refresh, customer: { id, restaurant, name, phone, email, is_active, date_joined } }
export type CustomerLoginResponse = {
  access: string;
  refresh: string;
  customer: {
    id: number;
    restaurant: number;
    name: string;
    phone: string;
    email: string;
    is_active: boolean;
    date_joined: string;
  };
  // Legacy fallback — some versions return `user` instead of `customer`
  user?: {
    id: number;
    username?: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    gender?: string | null;
    is_active: boolean;
    date_joined: string;
  };
};

export type CustomerUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender?: string | null;
  is_active: boolean;
  date_joined: string;
};

export type CustomerProfile = {
  id: number;
  user: CustomerUser;
  gender?: string | null;
  phone: string;
  default_address?: number | null;
  created_at: string;
  updated_at: string;
};

export type UpdateCustomerPayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: string;
};

export type CustomerAddress = {
  id: number;
  customer: number;
  label?: string | null;
  address: string;        // backend field name (not line1)
  landmark?: string | null;
  city: string;
  is_default: boolean;
  created_at: string;
};

export type AddAddressPayload = {
  label?: string;
  address: string;        // required by backend
  landmark?: string;
  city?: string;
  is_default?: boolean;
};

export type UpdateAddressPayload = Partial<AddAddressPayload>;

export type OrderHistoryItem = {
  id: number;
  order_no: string;
  order_type: string;
  status: string;
  total: string;
  placed_at: string;
  estimated_delivery_at?: string | null;
  delivered_at?: string | null;
  branch_name?: string | null;
  payment_method: string;
  items_count: number;
};

// ─── Fixed Deal ───────────────────────────────────────────────────────────────

export type FixedDealItem = {
  id: number;
  item: number;
  item_detail?: MenuItem;      // full item object (nested)
  quantity: number;
};

export type FixedDeal = {
  id: number;
  restaurant: number;
  category: number | null;
  category_detail?: MenuCategory | null;
  name: string;
  description?: string | null;
  feature_image?: string | null;   // field name is feature_image (not image)
  price: string;
  discount?: string;
  discount_type?: 'fixed' | 'percentage';
  final_price: string;
  items_detail?: FixedDealItem[];
  valid_from_date?: string | null;
  valid_to_date?: string | null;
  status: number;                  // int: 1=active, 0=inactive
  date_added?: string;
  date_updated?: string;
};

export type FixedDealListParams = {
  restaurant?: number;
  status?: number;
  page?: number;
  page_size?: number;
};

// ─── On Spot Deal ─────────────────────────────────────────────────────────────

/** An add-on-category option within an addon_items group (standalone API). */
export type OnSpotDealGroupAddonOption = {
  id: null;
  item: null;
  item_detail: null;
  addon: number;
  addon_detail: {
    id: number;
    addon_category: number;
    addon_category_name: string;
    name: string;
    description?: string;
    price: string;
    photo?: string | null;
    status: boolean;
  };
  quantity: number;
  max_quantity: number | null;
};

/** A manually-curated item option within a normal_dish group (standalone API). */
export type OnSpotDealGroupItemOption = {
  id: number;
  item: number;
  item_detail?: MenuItem;
  quantity: number;
  max_quantity: number | null;
};

export type OnSpotDealGroupOption =
  | OnSpotDealGroupAddonOption
  | OnSpotDealGroupItemOption;

export type OnSpotDealGroup = {
  id: number;
  name: string;
  group_type: 'normal_dish' | 'addon_items';
  is_required: boolean;
  select_quantity: number;
  addon_category: number | null;
  addon_category_detail: {
    id: number;
    name: string;
    description?: string;
    status: boolean;
  } | null;
  options: OnSpotDealGroupOption[];
};

export type OnSpotDeal = {
  id: number;
  restaurant: number;
  category: number | null;
  category_detail?: MenuCategory | null;
  name: string;
  description?: string | null;
  feature_image?: string | null;   // field name is feature_image (not image)
  price: string;
  discount?: string;
  discount_type?: 'fixed' | 'percentage';
  final_price: string;
  items_detail?: FixedDealItem[];
  groups_detail?: OnSpotDealGroup[];
  valid_from_date?: string | null;
  valid_to_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: number;                  // int: 1=active, 0=inactive
  is_available_now?: boolean;
  date_added?: string;
  date_updated?: string;
};

export type OnSpotDealListParams = {
  restaurant?: number;
  status?: number;
  page?: number;
  page_size?: number;
};
