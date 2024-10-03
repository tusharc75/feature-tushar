import { WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';

export const createRepairJobFlow = (): WalkmeData => {

  const data: WalkmeData = {
    name: `Add ${routes.repairJob.title}`,
    url: '/repair-job',
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
      }
    ]
  };
  return data;
};

export const generateAddExistingSerialisedAsset = (waitForStepInsertion: boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add Existing SerialisedAsset',
    url: '/repair-job/detail/:id',
    steps: [
      {
        target: '#main-tab-1',
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#add-menu-button',
        title: 'Add Existing SerialisedAsset'
      },
      {
        target: '#add-existing-serialised-asset-menu-item',
        title: 'Add Existing SerialisedAsset',
        content: 'Click here to add existing SerialisedAsset.',
      },
      {
        target: `#serializedAssets_assign-table-checkbox-0`,
        title: 'Select a SerialisedAsset'
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

export const generateAddNewSerialisedAsset = (waitForStepInsertion: boolean = false): WalkmeData => {

  const data: WalkmeData = {
    name: 'Add New SerialisedAsset',
    url: '/repair-job/detail/:id',
    steps: [  
      {
        target: '#main-tab-1',
        title: 'Details',
        content: 'Navigate to details page'
      },
      {
        target: '#add-menu-button',
        title: 'Add New SerialisedAsset'
      },
      {
        target: '#add-new-serialised-asset-menu-item',
        title: 'Add New SerialisedAsset',
        content: 'Click here to add new serialisedAsset.',
        waitForStepInsertion: true,
        willOpenDialog: true,
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

export const generateEditSerialisedAsset = (waitForStepInsertion: boolean = false, index: number): WalkmeData => {

  const data: WalkmeData = {
    name: 'Edit Serialised Asset',
    url: '/repair-job/detail/:id',
    steps: [
      {
        target: `#edit-button-${index}`,
        title: 'Edit Serialised Asset',
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
