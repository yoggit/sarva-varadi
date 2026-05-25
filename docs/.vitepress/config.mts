import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Sarva-Varadi',
  description: 'Universal test reporting for Playwright, Selenium, RestAssured & Cucumber — single HTML file, no server.',
  base: '/sarva-varadi/docs/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/sarva-varadi/docs/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Live Demos', link: 'https://yoggit.github.io/sarva-varadi/' },
      { text: 'GitHub', link: 'https://github.com/yoggit/sarva-varadi' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Quick Start', link: '/quickstart' },
          { text: 'Configuration', link: '/configuration' },
        ],
      },
      {
        text: 'Report Guide',
        items: [
          { text: 'The 6 Sections', link: '/report-guide' },
          { text: 'Run History', link: '/run-history' },
          { text: 'PDF & Export', link: '/export' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Notifications', link: '/notifications' },
          { text: 'CLI Converter', link: '/converter' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yoggit/sarva-varadi' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Sarva-Varadi',
    },

    editLink: {
      pattern: 'https://github.com/yoggit/sarva-varadi/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
