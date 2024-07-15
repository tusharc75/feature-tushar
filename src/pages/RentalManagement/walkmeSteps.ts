import { WalkmeData } from 'src/components/CustomIntro';

export const addRentalJobsSteps: WalkmeData = {
  name: 'Add rental jobs',
  urls: ['/rental-management'],
  steps: [
    {
      url: '/rental-management',
      title: 'Add ',
      target: '#add-button',
      content: ''
    },
    {
      target: '#field-customer-account',
      url: '/rental-management',
      title: 'Select customer account',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#field-well-name',
      url: '/rental-management',
      title: 'Select well name',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#field-billing-address',
      url: '/rental-management',
      title: 'Select billing address',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#field-shipping-address',
      url: '/rental-management',
      title: 'Select shipping address',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#field-estimate-end-date',
      url: '/rental-management',
      title: 'Select estimate end date',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#field-plant',
      url: '/rental-management',
      title: 'Select plant',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#dialog-save-button',
      url: '/rental-management',
      title: 'Save',
      content: ''
    }
  ]
};
