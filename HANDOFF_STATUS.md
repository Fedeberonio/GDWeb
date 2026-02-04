Current Architecture: Monorepo (apps/web is the Next.js app).

Database: Firebase Staging (greendolio-staging).

Data Status: Database IS seeded with products (Collection: catalog_products), but the Frontend is NOT rendering them yet.

Visuals: V2.0 Design is restored (Glassmorphism, Flags). DO NOT TOUCH CSS.

Immediate Next Task: Debug apps/web/src/modules/catalog/api.ts. The collection names in the code (products) likely do not match the seeded data (catalog_products), causing empty sections.
