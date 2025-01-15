import { generateFormFieldSteps, StepDefination, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';

export const generateAddExistingSerializedAsset = (
  waitForStepInsertion = false,
  name = `Add Existing ${sidebarResource?.serializedAsset}`
): WalkmeData => ({
  name: name,
  url: `${routes?.repairOrderDetail?.path}/:id`,
  steps: [
    {
      target: '#main-tab-1',
      title: 'Details',
      content: 'Navigate to details page'
    },
    {
      target: '#add-menu-button',
      title: name
    },
    {
      target: '#add-existing-serialized-asset-menu-item',
      title: name
    },
    {
      target: `#${sidebarResource.serializedAsset.split(' ').join('-')}-table-checkbox-0`,
      title: 'Add a Product'
    },
    {
      target: '#dialog-add-button',
      title: 'Add',
      waitForStepInsertion
    }
  ]
});

export const nextButtonStep = (waitForStepInsertion: boolean = false): StepDefination => ({
  target: '#step-next-button',
  title: 'Next',
  waitForStepInsertion
});

export const generateAutoCompleteSteps = (waitForStepInsertion = false, renderedFrom = ''): WalkmeData => {
  const data: WalkmeData = {
    url: `${routes?.repairOrderDetail?.path}/:id`,
    name: 'Auto Complete Work Order',
    steps: [
      {
        target: `#${renderedFrom}-table-checkbox-0`,
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#details-page-action-button',
        title: 'Open Action Button'
      },
      {
        target: '#auto-complete-work-order',
        title: 'Auto Complete Work Order'
      },
      {
        target: '#confirmation-dialog-confirm-button',
        title: 'Confirm',
        waitForStepInsertion
      }
    ]
  };

  return data;
};

export const generateCompleteStepData = (): WalkmeData => {
  const data: WalkmeData = {
    url: `${routes?.repairOrderDetail?.path}/:id`,
    name: 'Complete Work Order',
    steps: [
      {
        target: '#header-button-complete',
        title: 'Complete',
        nextButtonName: 'Complete'
      }
    ]
  };
  return data;
};

export const createRepairOrderFlow = (fields: any): WalkmeData => {
  const ignoreField = ['currency', 'owner'];

  const data: WalkmeData = {
    name: `Create ${sidebarResource?.repairOrder}`,
    url: `${routes?.repairOrder?.path}`,
    type: 'flow',
    steps: [
      {
        title: `Create`,
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
