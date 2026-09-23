type ID = string | number;

type TemplateVars = Record<string, ID>;

export function buildUrl(
  template: string,
  vars: TemplateVars,
  queryParams?: Record<string, string | number | boolean | undefined | null>
): string {
  let url = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key];
    if (value === undefined || value === null) {
      console.warn(`[buildUrl] Missing template variable: ${key}`);
      return '';
    }
    return String(value);
  });

  if (queryParams) {
    const entries = Object.entries(queryParams).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    ) as [string, string | number | boolean][];

    if (entries.length > 0) {
      const separator = url.includes('?') ? '&' : '?';
      const qs = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      url += separator + qs;
    }
  }

  return url;
}

export const RESTAURANT_ID =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_RESTAURANT_ID) ||
  '3';

export function getRestaurantId(): string {
  if (typeof window !== 'undefined') {
    return (window as any).__RESTAURANT_ID__ || RESTAURANT_ID;
  }
  return RESTAURANT_ID;
}

const CART_TOKEN_KEY = 'trestech_cart_token';

export function getCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_TOKEN_KEY);
}

export function setCartToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(CART_TOKEN_KEY, token);
  else localStorage.removeItem(CART_TOKEN_KEY);
}
