import { WalkmeData } from 'src/components/CustomIntro';

export const addRentalJobsSteps: WalkmeData = {
  name: 'Add rental jobs',
  urls: ['/rental-management'],
  id: 'add-rental-jobs',
  steps: [
    {
      title: 'Add ',
      target: '#add-button',
      content: ''
    },
    {
      target: '#field-customer-account',
      title: 'Select customer account',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#field-well-name',
      title: 'Select well name',
      content: '',
      nextOnValueChange: true,
      skipIfValueExist: true
    },
    {
      target: '#field-billing-address',
      title: 'Select billing address',
      content: '',
      nextOnValueChange: true,
      skipIfValueExist: true
    },
    {
      target: '#field-shipping-address',
      title: 'Select shipping address',
      content: '',
      nextOnValueChange: true,
      skipIfValueExist: true
    },
    {
      target: '#field-estimate-end-date',
      title: 'Select estimate end date',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#field-plant',
      title: 'Select plant',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#dialog-save-button',
      title: 'Save',
      content: ''
    }
  ]
};
