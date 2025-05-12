import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const env = process.env.NEXT_CONFIG_ENV || 'production';

  // If not production, disallow all
  if (env !== 'production') {
    const allowedUAs = [
      'Discordbot', // Discord
      'LinkedInBot', // LinkedIn
      'facebookexternalhit', // Facebook
      'TelegramBot', // Telegram
      'Twitterbot', // Twitter/X
      'WhatsApp' // WhatsApp
    ];

    return {
      rules: [
        // Allow UAs for Open Graph testing
        ...allowedUAs.map((ua) => ({
          userAgent: ua,
          allow: '/'
        })),
        // Disallow all other user agents
        {
          userAgent: '*',
          disallow: '/'
        }
      ]
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/'
    }
  };
}
