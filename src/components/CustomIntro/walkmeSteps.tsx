import { camelCase } from 'lodash';
import { generateFormFieldSteps, WalkmeData } from 'src/components/CustomIntro';
import routes from 'src/components/Helpers/Routes';

export const createResourceFlow = (resource: string, fields: any): WalkmeData => {

  const ignoreField = ['currency', 'owner', 'pdfTemplate'];

  const data: WalkmeData = {
    name: `Add ${routes?.[camelCase(resource)]?.title}`,
    url: `${routes?.[camelCase(resource)]?.path}`,
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