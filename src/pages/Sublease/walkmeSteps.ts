import { generateFormFieldSteps, StepDefination, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';

export const nextButtonStep = (waitForStepInsertion = false): StepDefination => ({
  target: '#step-next-button',
  title: 'Next',
  waitForStepInsertion
});

export const generateStepSendToSupplier = (index = 0): WalkmeData => {
  const data: WalkmeData = {
    name: 'Send to Supplier',
    url: `${routes.subleaseDetail.path}/:id`,
    steps: [
      {
        target: `#sublease_grid-2-table-checkbox-${index}`,
        title: 'Select Product'
      },
      {
        target: '#send-to-supplier-button',
        title: 'Send to Supplier',
        willOpenDialog: true,
        waitForStepInsertion: true
      },
      { target: '#manage-ticket-dialog-save-button', title: 'Save', willOpenDialog: true }
    ]
  };
  return data;
};

export const generateReceiveStepReceive = (index: number, waitForStepInsertion = false): WalkmeData => ({
  name: 'Receive',
  url: `${routes.subleaseDetail.path}/:id`,
  steps: [
    {
      target: `#sublease_Receiving-table-checkbox-${index}`,
      title: 'Select Product'
    },
    {
      target: '#receive-product',
      title: 'Receive',
      willOpenDialog: true
    },
    { target: '#receive-dialog-save-button', title: 'Save', willOpenDialog: true },
    { target: '#receive-dialog-submit-button', title: 'Submit', checkForRequired: true, waitForStepInsertion }
  ]
});

export const generateAddStepEditProduct = (index: number, waitForStepInsertion = false): WalkmeData => ({
  name: 'Edit Product',
  url: `${routes.subleaseDetail.path}/:id`,
  steps: [
    {
      target: `#edit-product-button-${index}`,
      title: 'Edit',
      willOpenDialog: true
    },
    { target: '#field-qty', title: 'Select Quantity', nextOnValueChange: true, skipIfValueExist: true },
    { target: '#field-unit', title: 'Select Unit', nextOnValueChange: true, skipIfValueExist: true },
    { target: '#field-pricing-method', title: 'Select Pricing Method', nextOnValueChange: true, skipIfValueExist: true },
    { target: '#field-price', title: 'Change Price', nextOnValueChange: true },
    {
      target: '#sublease-qty-dialog-save-button',
      title: 'Save',
      nextButtonName: 'Save',
      waitForStepInsertion
    }
  ]
});

export const generateAddExistingProduct = (waitForStepInsertion = false): WalkmeData => ({
  name: 'Add Existing Product',
  url: `${routes.subleaseDetail.path}:id`,
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
      target: `#${sidebarResource.product}-table-checkbox-0`,
      title: 'Add a Product'
    },
    {
      target: '#dialog-add-button',
      title: 'Add',
      waitForStepInsertion: waitForStepInsertion
    }
  ]
});

export const createSubleaseFlow = (fields: any, path: any): WalkmeData => {
  const includeFields = ['fromWarehouse', 'toWarehouse', 'warehouse'];
  const data: WalkmeData = {
    name: `Create ${path}`,
    url: routes.sublease.path,
    type: 'flow',
    steps: [
      {
        title: `Add`,
        target: '#add-button'
      },
      ...generateFormFieldSteps(fields, [], includeFields),
      {
        target: '#dialog-save-button',
        title: 'Save',
        nextButtonName: 'Create',
        waitForStepInsertion: true
      }
    ]
  };
  return data;
};
