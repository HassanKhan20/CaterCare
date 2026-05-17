import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Catercare — home food, made by your neighbors',
    short_name: 'Catercare',
    description:
      'Hyperlocal home-food marketplace. Order from licensed home cooks in DFW; fair pay for cooks and drivers.',
    start_url: '/browse',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ECEDE6',
    theme_color: '#5C7546',
    categories: ['food', 'shopping', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
