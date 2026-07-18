import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Functional pages live under /[locale]/, so use locale wildcards to
      // actually block them (a bare "/account/" would never match "/pl/account/").
      disallow: ['/api/', '/*/account/', '/*/checkout/', '/*/success'],
    },
    sitemap: 'https://coffeeverve.pl/sitemap.xml',
    host: 'https://coffeeverve.pl',
  }
}
