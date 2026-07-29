import type { Preview } from '@storybook/react';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#050B18' },
        { name: 'light', value: '#ffffff' },
        { name: 'slate', value: '#0f172a' },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile (375)', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet (768)', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop (1440)', styles: { width: '1440px', height: '900px' } },
      },
      defaultViewport: 'mobile',
    },
    layout: 'centered',
    docs: {
      theme: undefined,
    },
    a11y: {
      element: '#storybook-root',
      config: {},
      options: {},
      manual: false,
    },
  },
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'Internationalization locale',
      defaultValue: 'ht',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'ht', title: 'Kreyòl Ayisyen' },
          { value: 'fr', title: 'Français' },
          { value: 'en', title: 'English' },
          { value: 'es', title: 'Español' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;