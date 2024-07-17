import { WalkmeData } from 'src/components/CustomIntro';

export const addExistingProduct: WalkmeData = {
  name: 'Add Existing Product',
  url: '/rental-management/detail/:id',
  steps: [
    {
      target: '#main-tab-1',
      title: 'Details',
      content: 'Navigate to details page'
    },
    {
      target: '#add-menu-button',
      title: 'Add Existing Product'
    },
    {
      target: '#add-existing-products-menu-item',
      title: 'Add Existing Product',
      content: 'Click here to add existing product.'
    },
    {
      target: '#Product-table-checkbox-0',
      title: 'Add a Product'
    },
    {
      target: '#dialog-add-button',
      title: 'Add'
    }
  ]
};

export const deleteAddedProduct: WalkmeData = {
  name: 'Delete added Product',
  url: '/rental-management/detail/:id',
  steps: [
    {
      target: '#rentalJobs_grid-1-table-checkbox-0',
      title: 'Select a product'
    },
    { target: '#details-page-action-button', title: 'Actions' },
    { target: '#delete-menu-item', title: 'Delete' },
    { target: '#confirmation-dialog-confirm-button', title: 'Confirm' }
  ]
};

export const generateAddChildProduct = (index: number): WalkmeData => ({
  name: 'Add Child Product',
  url: '/rental-management/detail/:id',
  steps: [
    {
      target: `#add-child-product-button-${index}`,
      title: 'Add Child Product'
    },
    {
      target: '#add-existing-child-product-menu-item',
      title: 'Add Existing Product'
    },
    {
      target: '#Product-table-checkbox-0',
      title: 'Add a Product'
    },
    {
      target: '#dialog-add-button',
      title: 'Add'
    }
  ]
});

export const generateAddStepEditProduct = (index: number): WalkmeData => ({
  name: 'Edit Product',
  url: '/rental-management/detail/:id',
  steps: [
    {
      target: `#edit-product-button-${index}`,
      title: 'Edit'
    },
    { target: '#field-unit', title: 'Select Unit', nextOnValueChange: true, skipIfValueExist: true },
    { target: '#field-pricing-method', title: 'Select Pricing Method', nextOnValueChange: true, skipIfValueExist: true },
    { target: '#field-price', title: 'Change Price', nextOnValueChange: true },
    {
      target: '#rental-job-qty-dialog-save-button',
      title: 'Save',
      nextButtonName: 'Save'
    }
  ]
});
