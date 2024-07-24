import { generateFormFieldSteps, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';
import { nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';

export const createFieldTicketFlow = (): WalkmeData => {

  const data: WalkmeData = {
    name: `Add ${routes.fieldTicket.title}`,
    url: '/field-ticket',
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
