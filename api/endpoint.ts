const API_ENDPOINTS = {
  StorefrontBrowse: {
    getBranches:       '/storefront/branches/',          // ?restaurant=<id>
    getBranchesByCity: '/storefront/branches/by-city/',  // ?cityId=<id>
    getCities:      '/storefront/cities/',      // ?branch=<branch_id> OR ?restaurant=<id>
    getAreas:       '/storefront/areas/',       // ?city=<city_id>
    getAreaDetail:  (id: number | string) => `/storefront/areas/${id}/`,
    getMenu:        '/storefront/menu/',        // ?branch=<id>&area=<id optional>
    getSettings:    '/storefront/settings/',    // ?restaurant=<id>
    locate:         '/storefront/locate/',      // ?lat=<lat>&lng=<lng>&restaurant=<id optional>
    getPopupBanners: '/storefront/popup-banners/', // ?restaurant=<id>
  },

  StorefrontDeals: {
    fixedDeals:    '/storefront/fixed-deals/',   // ?restaurant=<id>&status=true
    onSpotDeals:   '/storefront/on-spot-deals/', // ?restaurant=<id>&status=true
  },

  StorefrontOrders: {
    create: '/storefront/orders/',
    detail: (id: number | string) => `/storefront/orders/${id}/`,
  },

  StorefrontCustomerAuth: {
    login:           '/storefront/customers/login/',
    register:        '/storefront/customers/register/',
    refreshToken:    '/storefront/customers/refresh/',
    getMyProfile:    '/storefront/customers/me/',
    updateMyProfile: '/storefront/customers/me/',
    deleteCustomer:  '/storefront/customers/me/',
    addAddress:      '/storefront/customers/addresses/',
    getAddresses:    '/storefront/customers/addresses/',
    updateAddress:   '/storefront/customers/addresses/{{customer_address_id}}/',
    deleteAddress:   '/storefront/customers/addresses/{{customer_address_id}}/',
    getOrderHistory: '/storefront/customers/orders/',
  },
} as const;

export default API_ENDPOINTS;
