import { SEO_COUNTRY, type SiteSeo } from '@/lib/seo/site'

/** Restaurant + WebSite structured data, built from the restaurant's own data. */
export function JsonLd({ site }: { site: SiteSeo }) {
  const restaurant: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${site.siteUrl}/#restaurant`,
    name: site.siteName,
    description: site.description,
    url: site.siteUrl,
    ...(site.logo ? { logo: site.logo, image: site.logo } : {}),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.address
      ? { address: { '@type': 'PostalAddress', streetAddress: site.address, addressCountry: SEO_COUNTRY } }
      : {}),
    ...(site.cuisines.length ? { servesCuisine: site.cuisines } : {}),
    ...(site.hours.length
      ? {
          openingHoursSpecification: site.hours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.day,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
    hasMenu: site.siteUrl,
    acceptsReservations: false,
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.siteUrl}/#website`,
    name: site.siteName,
    url: site.siteUrl,
    inLanguage: 'en',
    publisher: { '@id': `${site.siteUrl}/#restaurant` },
  }

  // `<` escaped so admin-entered text can never close the script tag
  const json = JSON.stringify([restaurant, website]).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
