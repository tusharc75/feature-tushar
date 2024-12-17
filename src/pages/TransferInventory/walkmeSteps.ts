import { camelCase } from 'lodash';
import { generateFormFieldSteps, StepDefination, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';

export const nextButtonStep = (waitForStepInsertion = false): StepDefination => ({
  target: '#step-next-button',
  title: 'Next',
  waitForStepInsertion
});

export const generateCompleteButtonStep = (): WalkmeData => ({
  name: 'Complete',
  url: `${routes.transferInventoryDetail.path}/:id`,
  steps: [
    {
      target: `#transfer-inventory-complete-button`,
      title: 'Complete'
    }
  ]
});

export const generateLoadingStepReceive = (index: number, resource: any): WalkmeData => ({
  name: 'Receive',
  url: `${routes.transferInventoryDetail.path}/:id`,
  steps: [
    {
      target: `#${camelCase(resource)}_grid-3-table-checkbox-${index}`,
      title: 'Select Product'
    },
    {
      target: '#details-page-action-button',
      title: 'Actions',
      willOpenDialog: true
    },
    { target: '#receive-menu-item', title: 'Create Loading Ticket', willOpenDialog: true },
    { target: '#receive-dialog-receive-button', title: 'Receive' }
  ]
});

export const generateLoadingStepCreateLoadingTicket = (index: number, resource: any): WalkmeData => ({
  name: 'Create Loading Ticket',
  url: `${routes.transferInventoryDetail.path}/:id`,
  steps: [
    {
      target: `#${camelCase(resource)}_grid-3-table-checkbox-${index}`,
      title: 'Select Product'
    },
    {
      target: '#details-page-action-button',
      title: 'Actions',
      willOpenDialog: true
    },
    { target: '#create-loading-ticket-menu-item', title: 'Create Loading Ticket', willOpenDialog: true, waitForStepInsertion: true },
    { target: '#manage-ticket-dialog-save-button', title: 'Save' }
  ]
});

export const generateAddExistingProduct = (waitForStepInsertion = false, resource: any): WalkmeData => ({
  name: 'Add Existing Product',
  url: `${routes.transferInventoryDetail.path}/:id`,
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
      target: `#${camelCase(resource)}_grid-1_sub-1-table-checkbox-0`,
      title: 'Add a Product'
    },
    {
      target: '#dialog-add-button',
      title: 'Add',
      waitForStepInsertion: waitForStepInsertion
    }
  ]
});

export const createTransferInventoryFlow = (fields: any, resource: any): WalkmeData => {
  const includeFields = [];
  const data: WalkmeData = {
    name: `Add ${resource}`,
    url: routes.transferInventory.path,
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
