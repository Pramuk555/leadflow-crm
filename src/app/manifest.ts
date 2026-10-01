import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LeadFlow CRM',
    short_name: 'LeadFlow',
    description: 'Lead tracking CRM for web dev agencies',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050810',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/leadflow-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
