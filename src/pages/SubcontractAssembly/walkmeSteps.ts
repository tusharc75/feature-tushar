import { WalkmeData } from 'src/components/CustomIntro';

export const addSubcontractStep: WalkmeData = {
  name: 'Add subcontract',
  id: 'subcontract-assembly_add-subcontract',
  urls: ['/subcontract-assembly'],
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
      target: '#field-shipping-address',
      url: '/subcontract-assembly',
      title: 'Shipping address',
      content: '',
      nextOnValueChange: true,
      skipIfValueExist: true
    },
    {
      target: '#field-billing-address',
      url: '/subcontract-assembly',
      title: 'Billing address',
      content: '',
      nextOnValueChange: true,
      skipIfValueExist: true
    },
    {
      target: '#field-warehouse',
      url: '/subcontract-assembly',
      title: 'select address',
      content: '',
      nextOnValueChange: true
    },
    {
      target: '#field-owner',
      url: '/subcontract-assembly',
      title: 'Select Owner',
      content: '',
      nextOnValueChange: true,
      skipIfValueExist: true
    },
    {
      target: '#dialog-save-button',
      url: '/subcontract-assembly',
      title: 'Save',
      content: ''
    }
  ]
};

export const addStepAddExistingProduct: WalkmeData = {
  name: 'Add Existing Product',
  id: 'subcontract-assembly_add-step-add-existing-product',
  urls: ['/subcontract-assembly/detail/:id', '/subcontract-assembly/detail/:id?itemTab=1', '/subcontract-assembly/detail/:id?itemTab=0'],
  steps: [
    {
      url: '/subcontract-assembly/:id',
      title: 'Go to details tab',
      target: '#main-tab-1',
      content: ''
    },
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Click Add Button',
      target: '#add-menu-button',
      content: ''
    },
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Add Existing Product',
      target: '#add-existing-product-menu-item',
      content: ''
    },
    {
      target: '#Product-table-checkbox-0',
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Select a product',
      content: ''
    },
    {
      target: '#dialog-add-button',
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Add Product',
      content: ''
    }
  ]
};

export const deleteExistingProductViaAction: WalkmeData = {
  name: 'Delete Existing Product',
  urls: ['/subcontract-assembly/detail/:id?itemTab=1'],
  id: 'subcontract-assembly_add-step-delete-existing-product',
  steps: [
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Select a product',
      target: '#subcontractAssembly_Material-table-checkbox-0',
      content: ''
    },
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Click on action button',
      target: '#details-page-action-button',
      content: ''
    },
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Click on action button',
      target: '#action-delete-menu-item',
      content: ''
    }
  ]
};

export const addProductConsumable: WalkmeData = {
  name: 'Add Products/Consumables',
  urls: ['/subcontract-assembly/detail/:id?itemTab=1'],
  id: 'subcontract-assembly_add-step-add-product-consumables',
  steps: [
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Select Product',
      target: '#select-product-dropdown',
      content: '',
      nextOnValueChange: (val) => val !== 'All' && val.length > 0
    },
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Click on Add',
      target: '#add-consumable-button',
      content: ''
    },
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Select a product',
      target: '#Product-table-checkbox-0',
      content: ''
    },
    {
      url: '/subcontract-assembly/:id?itemTab=1',
      title: 'Add',
      target: '#dialog-add-button',
      content: ''
    }
  ]
};
