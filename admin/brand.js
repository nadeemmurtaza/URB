// URB's identity for the admin. Same shape as library/config/brand.ts; values measured or taken from URB's public pages.
// Unknown values are left empty on purpose (see docs/RESEARCH.md): the admin never invents contact details.
export const brand = {
  identity: { name: 'URB', shortName: 'urb', tagline: 'ur beloved', domain: '', adminTitle: 'URB Admin' },
  contact: { email: '', phone: '', city: '', country: 'Pakistan' },
  socials: { instagram: 'https://www.instagram.com/shop.urb', tiktok: 'https://www.tiktok.com/@shop.urb', facebook: 'https://www.facebook.com/share/15Buz3M4xc/' },
  locale: { currency: 'PKR', minorUnits: 0, dialCode: '+92', timezone: 'Asia/Karachi', intlTag: 'en-PK' },
  theme: { light: 'urb', dark: 'urb-dark' },
  artwork: { logo: '../assets/logo.png' },
}
// Demo sign-ins. A static site cannot protect data: these only show how roles behave.
export const USERS = [
  { email: 'owner@urb.example', name: 'Owner', role: 'owner', secret: 'urb-demo-2026' },
  { email: 'manager@urb.example', name: 'Manager', role: 'manager', secret: 'urb-demo-2026' },
  { email: 'staff@urb.example', name: 'Staff', role: 'staff', secret: 'urb-demo-2026' },
]
