import { WalkmeData } from 'src/components/CustomIntro';

export const addRentalJobsSteps: WalkmeData = {
  name: 'Add rental jobs',
  url: '/rental-management',
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
      nextOnValueChange: true,
      formFields: true
    },
    {
      target: '#dialog-save-button',
      title: 'Save',
      content: ''
    }
  ]
};
