import { camelCase, startCase } from 'lodash';
import { WalkmeData } from 'src/components/CustomIntro';

export const createPurchaseOrderFlow = (resource: any): WalkmeData => {
  const data: WalkmeData = {
    name: `Create ${resource}`,
    url: '/purchase-order',
    type: 'flow',
    steps: [
      {
        title: `Add`,
        target: '#add-button',
        waitForStepInsertion: true
      },
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

export const generateAddExistingService = (waitForStepInsertion: boolean = false): WalkmeData => {
  const data: WalkmeData = {
    name: 'Add Existing Service',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: '#main-tab-1',
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#add-menu-button',
        title: 'Add Existing Service'
      },
      {
        target: '#add-existing-service-menu-item',
        title: 'Add Existing Service',
        content: 'Click here to add existing service.'
      },
      {
        target: `#Service-Master-table-checkbox-0`,
        title: 'Select a Service',
        isPreviousButtonDisabled: true
      },
      {
        target: '#dialog-add-button',
        title: 'Add',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};

export const generateAddExistingProduct = (waitForStepInsertion: boolean = false): WalkmeData => {
  const data: WalkmeData = {
    name: 'Add Existing Product',
    url: '/purchase-order/detail/:id',
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
        target: '#add-existing-product-menu-item',
        title: 'Add Existing Product',
        content: 'Click here to add existing product.',
        waitForStepInsertion: true
      },
      {
        target: `#Product-table-checkbox-0`,
        title: 'Select a Product',
        isPreviousButtonDisabled: true
      },
      {
        target: '#dialog-add-button',
        title: 'Add',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};

export const generateAddManualEntry = (waitForStepInsertion: boolean = false): WalkmeData => {
  const data: WalkmeData = {
    name: 'Add Manual Entry',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: '#main-tab-1',
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#add-menu-button',
        title: 'Add Manual Entry'
      },
      {
        target: '#add-manual-entry-menu-item',
        title: 'Add Manual Entry',
        content: 'Click here to add manual entry.',
        waitForStepInsertion: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};

export const generateAddNewService = (waitForStepInsertion: boolean = false): WalkmeData => {
  const data: WalkmeData = {
    name: 'Add New Service',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: '#main-tab-1',
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#add-menu-button',
        title: 'Add New Service'
      },
      {
        target: '#add-new-service-menu-item',
        title: 'Add New Service',
        content: 'Click here to add new service.',
        waitForStepInsertion: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};

export const generateEditService = (waitForStepInsertion: boolean = false, index: number): WalkmeData => {
  const data: WalkmeData = {
    name: 'Edit Service',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: `#edit-service-button-${index}`,
        title: 'Edit Service',
        waitForStepInsertion: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};

export const generateEditProduct = (waitForStepInsertion: boolean = false, index: number): WalkmeData => {
  const data: WalkmeData = {
    name: 'Edit Product',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: `#edit-product-button-${index}`,
        title: 'Edit Product',
        waitForStepInsertion: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};

export const generateEditManualEntry = (waitForStepInsertion: boolean = false, index: number): WalkmeData => {
  const data: WalkmeData = {
    name: 'Edit Manual Entry',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: `#edit-manualEntry-button-${index}`,
        title: 'Edit Manual Entry',
        waitForStepInsertion: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};

export const generateReceiveProduct = (addStorageLocation = false, index: number = 0, resource: any): WalkmeData => {
  const data: WalkmeData = {
    name: 'Receive',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: `#${camelCase(resource)}_grid-4-table-checkbox-${index}`,
        title: 'Receive',
        isPreviousButtonDisabled: true
      },
      {
        target: '#receive-button',
        title: 'Receive',
        willOpenDialog: true
      },
      ...(addStorageLocation
        ? [
            {
              target: '#select-storage-location',
              title: 'Select Storage Location',
              nextOnValueChange: true
            }
          ]
        : []),
      {
        target: '#dialog-save-button',
        title: 'Save',
        isPreviousButtonDisabled : !addStorageLocation,
        waitForStepInsertion: false
      }
    ]
  };
  return data;
};

export const generateRejectProduct = (addStorageLocation = false, index: number = 0, resource): WalkmeData => {
  const data: WalkmeData = {
    name: 'Reject',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: `#${camelCase(resource)}_grid-4-table-checkbox-${index}`,
        title: 'Reject',
        isPreviousButtonDisabled: true
      },
      {
        target: '#reject-button',
        title: 'Reject',
        willOpenDialog: true
      },
      ...(addStorageLocation
        ? [
            {
              target: '#select-storage-location',
              title: 'Select Storage Location',
              nextOnValueChange: true
            }
          ]
        : []),
      {
        target: '#dialog-save-button',
        title: 'Save',
        isPreviousButtonDisabled : !addStorageLocation,
        waitForStepInsertion: false
      }
    ]
  };
  return data;
};

export const generateAddInvoice = (waitForStepInsertion: boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add Invoices',
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: '#main-tab-2',
        title: 'Details',
        content: 'Navigate to Invoice page'
      },
      {
        target: '#add-menu-button',
        title: 'Add Invoice'
      },
      {
        target: `#add-invoice-button`,
        title: 'Click here to Add Invoice',
      },
      {
        target: `#enter-invoice-number`,
        title: 'Enter Invoice Number',
        isPreviousButtonDisabled : true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};

export const generateDeleteStep = (waitForStepInsertion: boolean = false, index: number = 0, type: string): WalkmeData => {
  const data: WalkmeData = {
    name: `Delete ${startCase(type)}`,
    url: '/purchase-order/detail/:id',
    steps: [
      {
        target: `#delete-${type}-button-${index}`,
        title: `Delete ${startCase(type)}`,
        willOpenDialog: true
      },
      {
        target: '#confirmation-dialog-confirm-button',
        title: 'Confirm',
        waitForStepInsertion: waitForStepInsertion
      }
    ]
  };
  return data;
};
