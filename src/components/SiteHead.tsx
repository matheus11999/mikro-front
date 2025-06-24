import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface SiteHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SiteHead({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}: SiteHeadProps) {
  const { getSetting } = useSiteSettings();

  useEffect(() => {
    // Usar configurações do site como fallback
    const siteName = getSetting('site_name', 'PIX Mikro');
    const siteDescription = getSetting('site_description', 'Sistema de vendas automatizadas para MikroTik');
    const siteKeywords = getSetting('site_keywords', 'mikrotik, pix, vendas, hotspot, wifi');
    const favicon = getSetting('site_favicon', '/favicon.ico');
    const ogImage = getSetting('og_image', '/og-image.jpg');
    const metaTitle = getSetting('meta_title', 'PIX Mikro - Sistema de Vendas Automatizadas');
    const metaAuthor = getSetting('meta_author', 'PIX Mikro');
    const ogTitle = getSetting('og_title', 'PIX Mikro');
    const ogDescription = getSetting('og_description', 'Sistema completo de vendas automatizadas para MikroTik com PIX');
    const twitterCard = getSetting('twitter_card', 'summary_large_image');

    // Combinar títulos
    const fullTitle = title ? `${title} | ${siteName}` : metaTitle;
    const finalDescription = description || siteDescription;
    const finalKeywords = keywords || siteKeywords;
    const finalImage = image || ogImage;
    const finalOgTitle = title || ogTitle;

    // Atualizar title
    document.title = fullTitle;

    // Função helper para atualizar ou criar meta tag
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Atualizar meta tags básicas
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    updateMetaTag('author', metaAuthor);
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    updateMetaTag('theme-color', getSetting('theme_primary_color', '#3b82f6'));
    updateMetaTag('robots', 'index, follow');

    // Open Graph
    updateMetaTag('og:title', finalOgTitle, true);
    updateMetaTag('og:description', ogDescription, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', siteName, true);
    if (finalImage) updateMetaTag('og:image', finalImage, true);
    if (url) updateMetaTag('og:url', url, true);

    // Twitter Card
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', finalOgTitle);
    updateMetaTag('twitter:description', ogDescription);
    if (finalImage) updateMetaTag('twitter:image', finalImage);

    // Atualizar favicon
    let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = favicon;

    // Canonical URL
    if (url) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = url;
    }
  }, [title, description, keywords, image, url, type, getSetting]);

  return null; // Este componente não renderiza nada visível
} 