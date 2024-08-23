import { generateFormFieldSteps, StepDefination, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';

export const generateAddExistingProduct = (waitForStepInsertion = false): WalkmeData => ({
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

export const nextButtonStep: StepDefination = {
  target: '#step-next-button',
  title: 'Next',
  waitForStepInsertion: false
};

export const generateDeleteAddedProductSteps = (index: number, waitForStepInsertion = false): WalkmeData => ({
  name: 'Delete added Product',
  url: '/rental-management/detail/:id',
  steps: [
    {
      target: `#rentalJobs_grid-1-table-checkbox-${index}`,
      title: 'Select a product'
    },
    { target: '#details-page-action-button', title: 'Actions' },
    { target: '#delete-menu-item', title: 'Delete' },
    { target: '#confirmation-dialog-confirm-button', title: 'Confirm', waitForStepInsertion }
  ]
});

export const generateAddChildProduct = (index: number, waitForStepInsertion = false): WalkmeData => ({
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
      target: `#${sidebarResource.product}-table-checkbox-0`,
      title: 'Add a Product'
    },
    {
      target: '#dialog-add-button',
      title: 'Add',
      waitForStepInsertion
    }
  ]
});

export const generateAddStepEditProduct = (index: number, waitForStepInsertion = false): WalkmeData => ({
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
      nextButtonName: 'Save',
      waitForStepInsertion
    }
  ]
});

export const generateAssignStepAssignSerializedAsset = (index: number, waitForStepInsertion = false): WalkmeData => ({
  name: `Assign ${routes.serializedAsset.title}`,
  url: '/rental-management/detail/:id',
  steps: [
    {
      target: `#rental_management_serialized_asset-table-checkbox-${index}`,
      title: 'Select Product'
    },
    {
      target: '#assign-serialized-asset-button',
      title: 'Assign',
      nextButtonName: 'Assign',
      willOpenDialog: true
    },
    {
      target: '#serialized-products-0',
      title: 'Select Product'
    },
    {
      target: '#serializedAssets_assign-table-checkbox-0',
      title: 'Select Asset'
    },
    {
      target: '#add-to-job-button',
      title: 'Add to Job',
      waitForEnable: true
    },
    {
      target: '#asset-details-change-dialog-save-button',
      title: 'Save',
      waitForStepInsertion
    }
  ]
});

export const generateLoadingStepCreateTicketSteps = (index: number, insertMTRConfirmation = true, waitForStepInsertion = false): WalkmeData => {
  const data: WalkmeData = {
    name: 'Create Ticket',
    url: '/rental-management/detail/:id',
    steps: [
      {
        target: `#rentalJobs_grid-3-table-checkbox-${index}`,
        title: 'Select a product'
      },
      { target: '#details-page-action-button', title: 'Actions' },
      { target: '#create-loding-ticket-menu-item', title: 'Create Ticket', waitForStepInsertion: !insertMTRConfirmation && waitForStepInsertion }
    ]
  };

  if (insertMTRConfirmation) {
    data.steps.push({ target: '#confirmation-dialog-confirm-button', title: 'Confirm', waitForStepInsertion: insertMTRConfirmation });
  }

  data.steps.push({ title: 'Save', target: '#manage-ticket-dialog-save-button', waitForStepInsertion });

  return data;
};

export const generateDeliveredToCustomer = (index: number, waitForStepInsertion = false): WalkmeData => {
  const data: WalkmeData = {
    name: 'Deliver To Customer',
    url: '/rental-management/detail/:id',
    steps: [
      {
        target: `#rentalJobs_grid-3-table-checkbox-${index}`,
        title: 'Select a product'
      },
      { target: '#details-page-action-button', title: 'Actions' },
      { target: '#delivered-to-customer-menu-item', title: 'Create Ticket', waitForStepInsertion }
    ]
  };
  return data;
};

export const generateCreateReceivingTicket = (renderedFrom: string, showAssetDataDialog = true): WalkmeData => {
  const data: WalkmeData = {
    name: 'Create Receiving Ticket',
    url: '/rental-management/detail/:id',
    steps: [
      {
        target: `#${renderedFrom.split(' ').join('-')}-table-select-all-checkbox`,
        title: 'Select a product'
      },
      { target: '#details-page-action-button', title: 'Actions' },
      { target: '#create-receiving-ticket-chargaeble-menu-item', title: 'Create Receiving Ticket', waitForStepInsertion: !showAssetDataDialog }
    ]
  };
  if (showAssetDataDialog) {
    data.steps.push({ target: '#asset-details-change-dialog-save-button', title: 'Save', waitForStepInsertion: true });
  }
  data.steps.push({ target: '#manage-ticket-dialog-save-button', title: 'Save' });
  return data;
};

export const generateReceiveItem = (renderedFrom: string): WalkmeData => {
  const data: WalkmeData = {
    name: 'Received Items',
    url: '/rental-management/detail/:id',
    steps: [
      {
        target: `#${renderedFrom.split(' ').join('-')}-table-select-all-checkbox`,
        title: 'Select a product'
      },
      { target: '#details-page-action-button', title: 'Actions' },
      { target: '#received-items-menu-item', title: 'Create Receiving Ticket' }
    ]
  };
  return data;
};

export const createSendEmailStep = () => {
  const data: WalkmeData = {
    name: 'Send Email',
    url: '/rental-management/detail/:id',
    steps: [
      { target: '#details-page-send-email-button', title: 'Select View', willOpenDialog: true },
      { target: '#show-column-dialog-send-email-button', title: 'Send Email', waitForStepInsertion: true, willOpenDialog: true },
      { target: '#send-email-dialog-send-button', title: 'Send' }
    ]
  };
  return data;
};

export const createCloseStep = (renderedFrom: string) => {
  const data: WalkmeData = {
    name: 'Close',
    url: '/rental-management/detail/:id',
    steps: [{ target: '#rental-management-close-button', title: `Close ${renderedFrom}` }]
  };
  return data;
};

export const createRentalJobsFlow = (fields: any): WalkmeData => {
  const ignoreField = ['currency', 'owner', 'pdfTemplate'];

  const data: WalkmeData = {
    name: `Add ${routes.rentalManagement.title}`,
    url: '/rental-management',
    type: 'flow',
    steps: [
      {
        title: `Add`,
        target: '#add-button'
      },
      ...generateFormFieldSteps(fields, ignoreField),
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
