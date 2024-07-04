import { IntroStep } from 'src/components/CustomIntro';

export const stepData: IntroStep = {
  '/subcontract-assembly/detail/:id': {
    name: 'Add Subcontract',
    steps: [
      {
        target: '#main-tab-1',
        url: '/subcontract-assembly/detail/:id',
        title: 'Details',
        content: 'Go to details page.',
        waitForUserClick: false
      },
      {
        target: '#add-menu-button',
        url: '/subcontract-assembly/detail/:id?itemTab=1',
        title: 'Add button',
        content: 'Click on add button to add existing produts',
        waitForUserClick: true
      },
      {
        target: '.MuiButtonBase-root.MuiIconButton-root.MuiAutocomplete-popupIndicator',
        url: '/subcontract-assembly/detail/:id?itemTab=1',
        title: 'Select Product',
        content: 'Select added products to do further actions',
        waitForUserClick: true
      }
    ]
  }
};
