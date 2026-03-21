import type { Article } from './types'

// Products are loaded from API (MongoDB + Cloudinary). See src/api/products.ts and ProductsContext.

export const articles: Article[] = [
  {
    id: '1',
    title: 'Bio-Based Fabrics Are Reshaping the Fashion Industry',
    excerpt: 'From algae and mushroom leather to lab-grown silk, new biomaterials are replacing petroleum-based textiles and cutting waste.',
    image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1200',
    slug: 'bio-fabrics-fashion',
    date: 'February 2025',
    url: 'https://www.vogue.com/article/bio-based-fabrics-sustainable-fashion',
  },
  {
    id: '2',
    title: 'The Rise of Biofabrication: Growing Clothes From Microbes',
    excerpt: 'Designers and scientists are using bacteria, yeast, and fungi to grow wearable materials—no cotton or polyester required.',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    slug: 'biofabrication-microbes',
    date: 'January 2025',
    url: 'https://www.theguardian.com/fashion/sustainable-fashion',
  },
  {
    id: '3',
    title: 'New Technologies in Fashion: AI, 3D Design, and Smart Textiles',
    excerpt: 'How automation, digital design tools, and connected fabrics are changing how clothes are made and worn.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
    slug: 'fashion-tech-2025',
    date: 'March 2025',
    url: 'https://www.businessoffashion.com/articles/technology/',
  },
  {
    id: '4',
    title: 'Circular Fashion Tech: Recycling Fibers Into New Garments',
    excerpt: 'New chemical recycling and fiber-to-fiber processes are turning old clothes into high-quality new textiles.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    slug: 'circular-fashion-tech',
    date: 'April 2025',
    url: 'https://www.mckinsey.com/industries/retail/our-insights/fashion-on-climate',
  },
]
