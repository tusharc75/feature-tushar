import { generateFormFieldSteps, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';
import { nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';

export const createFieldTicketFlow = (fieldTicketTitle): WalkmeData => {

  const data: WalkmeData = {
    name: `Create ${fieldTicketTitle}`,
    url: '/field-ticket',
    type: 'flow',
    steps: [
      {
        title: `Create`,
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

export const generateAddExistingService= (waitForStepInsertion: boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add Existing Service',
    url: '/field-ticket/detail/:id',
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
        content: 'Click here to add existing service.',
      },
      {
        target: `#Service-Master-table-checkbox-0`,
        title: 'Select a Service'
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

export const generateAddManualEntry= (waitForStepInsertion: boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add Manual Entry',
    url: '/field-ticket/detail/:id',
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
        waitForStepInsertion: true,
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

export const generateAddNewService= (waitForStepInsertion: boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add New Service',
    url: '/field-ticket/detail/:id',
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
        waitForStepInsertion: true,
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

export const generateEditService= (waitForStepInsertion: boolean = false, index: number): WalkmeData => {

  const data: WalkmeData = {
    name: 'Edit Service',
    url: '/field-ticket/detail/:id',
    steps: [
      {
        target: `#edit-service-button-${index}`,
        title: 'Edit Service',
        waitForStepInsertion: true,
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

export const generateEditManualEntry= (waitForStepInsertion: boolean = false, index: number): WalkmeData => {

  const data: WalkmeData = {
    name: 'Edit Manual Entry',
    url: '/field-ticket/detail/:id',
    steps: [
      {
        target: `#edit-manualEntry-button-${index}`,
        title: 'Edit Manual Entry',
        waitForStepInsertion: true,
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

export const generateAddProductConsumable= (waitForStepInsertion: boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add Products/Consumables',
    url: '/field-ticket/detail/:id',
    steps: [
      {
        target: '#main-tab-1',
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#products-consumables-tab',
        title: 'Products/Consumables',
        content: 'Navigate to Products/Consumables Tab'
      },
      {
        target: `#select-service`,
        title: 'Select Service',
        nextOnValueChange: (val:any) => val !== 'All' && val.length > 0
      },
      {
        target: '#add-product-consumable',
        title: 'Add Products/Consumables',
      },
      {
        target: `#Product-table-checkbox-0`,
        title: 'Select a Product/Consumable'
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

export const generateAddTechnician= (waitForStepInsertion: boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add Technician',
    url: '/field-ticket/detail/:id',
    steps: [
      {
        target: '#main-tab-1',
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#technicians-tab',
        title: 'Add Technician',
        content: 'Navigate to Technicians Tab'
      },
      {
        target: `#select-service`,
        title: 'Select Service',
      },
      {
        target: '#add-technician',
        title: 'Add Technician',
      },
      {
        target: `#Employee-Master-table-checkbox-0`,
        title: 'Select a Technician'
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


export const generateFieldTicketSubmit= (): WalkmeData => {

  const data: WalkmeData = {
    name: 'Submit Field Ticket',
    url: '/field-ticket/detail/:id',
    steps: [
      {
        target: '#submit-field-ticket',
        title: 'Submit Field Ticket',
        waitForStepInsertion: true,
        willOpenDialog: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        waitForStepInsertion: false
      }
    ]
  };
  return data;
};


export const generateFieldTicketReopen= (): WalkmeData => {

  const data: WalkmeData = {
    name: 'Re-Open Field Ticket',
    url: '/field-ticket/detail/:id',
    steps: [
      {
        target: '#reopen-field-ticket',
        title: 'Re-Open Field Ticket',
      },
      {
        target: '#outlined-multiline-static',
        title: 'Add Comment',
        nextOnValueChange: (val) => val !== ''
      },
      {
        target: '#dialog-submit-button',
        title: 'Submit',
        waitForStepInsertion: false
      }
    ]
  };
  return data;
};