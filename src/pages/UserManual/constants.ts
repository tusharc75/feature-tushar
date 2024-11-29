import { Section } from 'src/pages/UserManual/type';

export const pageTitle = 'Equipt - User Manual';

export const homeLink = '/user-manual';
export const homepageData: Section[] = [
  { _id: 'home-page', content: 'Welcome to the Equipt Portal User Manual', sectionName: 'Equipt Portal User Manual' }
];
export const footerData = [
  {
    title: 'Social',
    links: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/company/equip-t/', type: 'external' },
      { label: 'Email', url: 'mailto:contact@equip-t.com', type: 'external' }
    ]
  },
  {
    title: 'More',
    links: [
      { label: 'Equipt Website', url: 'https://equip-t.com/', type: 'external' },
      { label: 'Equipt Portal', url: 'https://portal.equipt.ai/', type: 'external' }
    ]
  }
] as const;
