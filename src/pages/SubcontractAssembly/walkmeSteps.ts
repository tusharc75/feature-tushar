import { WalkmeData } from 'src/components/CustomIntro';

export const editSubcontract: WalkmeData = {
  name: 'Edit subcontract',
  url: '/subcontract-assembly/detail/:id',
  steps: [
    {
      title: 'Click Edit Button',
      target: '#edit-subcontract-0',
      waitForStepInsertion: true
    },
    {
      title: 'Save',
      target: '#edit-subcontract-material-button'
    }
  ]
};

export const addStepAddExistingProduct: WalkmeData = {
  name: 'Add Existing Product',
  url: '/subcontract-assembly/detail/:id',
  steps: [
    {
      title: 'Go to details tab',
      target: '#main-tab-1',
      content: ''
    },
    {
      title: 'Click Add Button',
      target: '#add-menu-button',
      content: ''
    },
    {
      title: 'Add Existing Product',
      target: '#add-existing-product-menu-item',
      content: ''
    },
    {
      target: '#Product-table-checkbox-0',
      title: 'Select a product',
      content: ''
    },
    {
      target: '#dialog-add-button',
      title: 'Add Product',
      content: ''
    }
  ]
};

export const deleteExistingProductViaAction: WalkmeData = {
  name: 'Delete Existing Product',
  url: '/subcontract-assembly/detail/:id',
  steps: [
    {
      title: 'Select a product',
      target: '#subcontractAssembly_Material-table-checkbox-0',
      content: ''
    },
    {
      title: 'Click on action button',
      target: '#details-page-action-button',
      content: ''
    },
    {
      title: 'Click on action button',
      target: '#action-delete-menu-item',
      content: ''
    }
  ]
};

export const addProductConsumable: WalkmeData = {
  name: 'Add Products/Consumables',
  url: '/subcontract-assembly/detail/:id',
  steps: [
    {
      title: 'Select Product',
      target: '#select-product-dropdown',
      content: '',
      nextOnValueChange: (val) => val !== 'All' && val.length > 0
    },
    {
      title: 'Click on Add',
      target: '#add-consumable-button',
      content: ''
    },
    {
      title: 'Select a product',
      target: '#Product-table-checkbox-0',
      content: ''
    },
    {
      title: 'Add',
      target: '#dialog-add-button',
      content: ''
    }
  ]
};
