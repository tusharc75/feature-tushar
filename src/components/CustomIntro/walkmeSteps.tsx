import { generateFormFieldSteps, StepDefination, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';

export const createResourceFlow = (fields: any, page: string): WalkmeData => {
  const ignoreField = ['currency', 'owner', 'pdfTemplate'];

  const data: WalkmeData = {
    name: `Add ${routes[page].title}`,
    url: `${routes[page].path}`,
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