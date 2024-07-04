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
        waitForUserClick: false
      },
      {
        target: '#add-existing-product-menu-item',
        url: '/subcontract-assembly/detail/:id?itemTab=1',
        title: 'Add existing Products',
        content: '',
        waitForUserClick: false
      },
      {
        target: '#Product-table-checkbox-0',
        url: '/subcontract-assembly/detail/:id?itemTab=1',
        title: 'Select product(s)',
        content: 'Select any product(s) from the table',
        waitForUserClick: false
      },
      {
        target: '#dialog-add-button',
        url: '/subcontract-assembly/detail/:id?itemTab=1',
        title: 'Add product(s)',
        content: 'Add products to your table',
        waitForUserClick: false
      },
      {
        target: '.MuiButtonBase-root.MuiIconButton-root.MuiAutocomplete-popupIndicator',
        url: '/subcontract-assembly/detail/:id?itemTab=1',
        title: 'Select Product',
        content: 'Select added products to do further actions',
        waitForUserClick: false
      }
    ]
  }
} as const;
