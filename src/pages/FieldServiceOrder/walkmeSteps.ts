import { camelCase } from 'lodash';
import { generateFormFieldSteps, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';
import { nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';

export const generateAddFieldTicket = (isNextStepAdd: Boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add Field Ticket',
    url: '/field-service-order/detail/:id',
    steps: [
      {
        target: '#main-tab-1',
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#add-menu-button',
        title: 'Add Field Ticket'
      },
      {
        target: '#add-field-ticket-menu-item',
        title: 'Add Field Ticket',
        content: 'Click here to add field ticket.',
        waitForStepInsertion: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        nextButtonName: 'Create',
      },
      ...isNextStepAdd ? [nextButtonStep] : []
    ]
  };
  return data;
};

export const createFieldServiceOrderFlow = (fields: any): WalkmeData => {

  const ignoreField = ['currency', 'owner', 'pdfTemplate'];

  const data: WalkmeData = {
    name: `Add ${routes.fieldServiceOrder.title}`,
    url: '/field-service-order',
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

export const generateFieldTicketActions = (index: number): Array<WalkmeData> => {

  const editFieldTicket: WalkmeData = {
    name: 'Edit Field Ticket', url: '/field-service-order/detail/:id',
    steps: [
      {
        target: `#edit-field-ticket-button-${index}`,
        title: 'Edit',
        waitForStepInsertion: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        nextButtonName: 'Save',
        waitForStepInsertion: false
      }
    ]
  };

  const cloneFieldTicket: WalkmeData = {
    name: 'Clone Field Ticket', url: '/field-service-order/detail/:id',
    steps: [
      {
        target: `#clone-field-ticket-button-${index}`,
        title: 'Clone',
        waitForStepInsertion: true
      },
      {
        target: '#dialog-save-button',
        title: 'Save',
        nextButtonName: 'Save',
        waitForStepInsertion: false
      }
    ]
  };

  const deleteFieldTicket: WalkmeData = {
    name: 'Delete Field Ticket',
    url: '/field-service-order/detail/:id',
    steps: [
      {
        target: `#${camelCase(routes?.fieldTicket.title)}-table-checkbox-${index}`,
        title: 'Select a Field Ticket'
      },
      { target: '#details-page-action-button', title: 'Actions' },
      { target: '#delete-menu-item', title: 'Delete' },
      { target: '#confirmation-dialog-confirm-button', title: 'Confirm', waitForStepInsertion: false }
    ]
  };
  return [editFieldTicket, cloneFieldTicket, deleteFieldTicket];
};