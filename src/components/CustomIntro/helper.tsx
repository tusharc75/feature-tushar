import { findIndex } from 'lodash';
import { StepDefination, WalkmeData } from 'src/components/CustomIntro';

export const getCurrentUrl = () => {
  const url = window.location.pathname;
  // const search = window.location.search;
  const hexPattern = /^[0-9a-fA-F]{24}$/;
  const splittedUrl = url.split('/');
  const newUrl = splittedUrl
    .map((url) => {
      if (hexPattern.test(url)) {
        return ':id';
      } else {
        return url;
      }
    })
    .join('/');
  return newUrl.endsWith('/') ? newUrl.slice(0, -1) : newUrl;
};

export function elemToSelector(el: HTMLElement) {
  if (el.tagName.toLowerCase() === 'html') {
    return 'HTML';
  }
  let selector = el.tagName.toLowerCase();
  selector += el.id ? `#${el.id}` : '';

  if (el.className) {
    const classes = el.className.split(/\s+/);
    for (const className of classes) {
      selector += `.${className}`;
    }
  }

  return elemToSelector(el.parentNode as HTMLElement) + ' > ' + selector;
}

export function debounce<T extends (...args: any[]) => void>(func: T, timeout = 300): [(...args: Parameters<T>) => void, () => void] {
  let timer: NodeJS.Timeout;
  const debouncedFunc = (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
  const teardown = () => clearTimeout(timer);

  return [debouncedFunc, teardown];
}

export const injectFormFields = (data, fields) => {
  const ignoreField = ['currency', 'owner', 'pdfTemplate', 'billingAddress', 'shippingAddress'];
  let fieldsStpes: StepDefination[] = [];
  fields?.forEach((e) => {
    if (e?.fieldData?.required && !ignoreField?.includes(e?.fieldData?.fieldName) && !e?.fieldData?.isDefaultValue && !e?.fieldData?.isUneditable) {
      fieldsStpes.push({
        title: `Select ${e?.fieldData?.fieldLabel}`,
        target: `#field-${e?.fieldData?.fieldLabel?.toLowerCase()?.split(' ').join('-')}`,
        content: '',
        nextOnValueChange: true,
        skipIfValueExist: true
      });
    }
  });
  const fieldIndex = findIndex(data?.steps, { formFields: true });
  if (fieldIndex < 0 || fieldsStpes?.length === 0) {
    return data;
  } else {
    data?.steps?.splice(fieldIndex + 1, 0, ...fieldsStpes);
    data.steps = data?.steps?.filter((e) => !e?.formFields);
    return data;
  }
};

export function generateFormFieldSteps(fields: any[], ignoreField?: string[], includeFields?: string[]) {
  let fieldsSteps: StepDefination[] = [];
  fields?.forEach((e) => {
    const isFieldIncluded = includeFields?.includes(e?.fieldData?.fieldName);
    if (
      (e?.fieldData?.required &&
        !ignoreField?.includes(e?.fieldData?.fieldName) &&
        // !e?.fieldData?.isDefaultValue &&
        !e?.fieldData?.isUneditable) ||
      isFieldIncluded
    ) {
      fieldsSteps.push({
        title: `Select ${e?.fieldData?.fieldLabel}`,
        target: `#field-${e?.fieldData?.fieldLabel?.toLowerCase()?.split(' ').join('-')}`,
        content: '',
        nextOnValueChange: true,
        skipIfValueExist: true,
        fieldType: e?.fieldData?.type,
        checkForRequired: isFieldIncluded
      });
    }
  });
  return fieldsSteps;
}

export function generateStepsFormfieldData(fields: any[], ignoreField?: string[], includeFields?: string[]) {
  let fieldsSteps: StepDefination[] = [];
  fields?.forEach((e) => {
    const isFieldIncluded = includeFields?.includes(e?.fieldData?.fieldName);
    if (
      (e?.required &&
        !ignoreField?.includes(e?.fieldName) &&
        //  !e?.isDefaultValue &&
        !e?.isUneditable) ||
      isFieldIncluded
    ) {
      fieldsSteps.push({
        title: `Select ${e?.fieldLabel}`,
        target: `#field-${e?.fieldLabel?.toLowerCase()?.split(' ').join('-')}`,
        content: '',
        nextOnValueChange: true,
        skipIfValueExist: true,
        fieldType: e?.type,
        checkForRequired: isFieldIncluded
      });
    }
  });
  return fieldsSteps;
}

export function createAddItemStepdata(route: { title: string; path: string }, fields: any[]) {
  const { title, path } = route;
  const ignoreField = ['currency', 'owner', 'pdfTemplate'];
  const walkmeData: WalkmeData = {
    name: `Add ${title}`,
    url: path,
    steps: []
  };

  let fieldsSteps: StepDefination[] = [
    {
      title: `Add`,
      target: '#add-button',
      content: ''
    }
  ];
  fieldsSteps.push(...generateFormFieldSteps(fields, ignoreField));
  fieldsSteps.push({
    target: '#dialog-save-button',
    title: 'Save',
    content: ''
  });

  walkmeData?.steps?.push(...fieldsSteps);
  return walkmeData;
}
