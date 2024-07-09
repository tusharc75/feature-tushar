import { WalkmeData } from 'src/components/CustomIntro';

export const stepData: WalkmeData[] = [
  {
    name: 'Add subcontract',
    url: '/subcontract-assembly',
    steps: [
      {
        url: '/subcontract-assembly',
        title: 'Add ',
        target: '#add-button',
        content: ''
      },
      {
        target: '#field-supplier-account',
        url: '/subcontract-assembly',
        title: 'Select suplier',
        content: '',
        nextOnValueChange: true
      },
      {
        target: '#field-warehouse',
        url: '/subcontract-assembly',
        title: 'select address',
        content: '',
        nextOnFocusOut: true
      },
      // {
      //   target: '#field-collaborator',
      //   url: '/subcontract-assembly',
      //   title: '',
      //   content: ''
      // },
      {
        target: '#dialog-save-button',
        url: '/subcontract-assembly',
        title: 'Add subcontract',
        content: ''
      }
    ]
  }
];
