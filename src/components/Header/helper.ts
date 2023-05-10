interface initialStateInterface {
  filteredData: filteredListInterface[];
  parentIndex?: number;
  childIndex?: number;
  isFirstTime?: boolean;
}

interface filteredListInterface {
  head?: string;
  items?: Item[];
}

interface Item {
  name?: string;
  resourceLabel?: string;
  sectionName?: string;
  homePageLabel?: null | string;
  roleType?: number;
  isRead?: boolean;
  isCreate?: boolean;
  isUpdate?: boolean;
  isDelete?: boolean;
  resourceId?: string;
  order?: number;
  sectionNameLowerCase?: string;
  resourceLabelLowerCase?: string;
}

interface actionInterface {
  type: 'arrowUp' | 'arrowDown' | 'setFilteredData' | 'resetIndex';
  payload?: filteredListInterface[];
  element?: HTMLDivElement;
}

export const filterReducerInitialState: initialStateInterface = { filteredData: [], parentIndex: 0, childIndex: 0, isFirstTime: true };

export const filterReducer = (state: initialStateInterface, action: actionInterface) => {
  switch (action.type) {
    case 'arrowUp':
      return {
        ...state,
        isFirstTime: false,
        ...decreaseIndex(state.filteredData, state.parentIndex, state.childIndex, action.element, state.isFirstTime)
      };
    case 'arrowDown':
      return {
        ...state,
        isFirstTime: false,
        ...increaseIndex(state.filteredData, state.parentIndex, state.childIndex, action.element, state.isFirstTime)
      };
    case 'setFilteredData':
      return {
        ...state,
        filteredData: action.payload
      };
    case 'resetIndex':
      return {
        ...state,
        isFirstTime: true,
        parentIndex: 0,
        childIndex: 0
      };
    default:
      return state;
  }
};

const increaseIndex = (
  data: filteredListInterface[],
  currentParentIndex: number,
  currentChildIndex: number,
  element: HTMLDivElement,
  isFirstTime: boolean
): { parentIndex: number; childIndex: number } => {
  let parentIndex = currentParentIndex;
  let childIndex = currentChildIndex;

  if (isFirstTime) {
    focusElement(element, 0, 0);
    return;
  }

  if (childIndex < data[parentIndex]?.items.length - 1) {
    childIndex++;
  } else {
    parentIndex++;
    if (parentIndex != data.length) {
      childIndex = 0;
    } else {
      parentIndex = 0;
      childIndex = 0;
    }
  }
  focusElement(element, parentIndex, childIndex);
  return {
    parentIndex,
    childIndex
  };
};

const decreaseIndex = (
  data: filteredListInterface[],
  currentParentIndex: number,
  currentChildIndex: number,
  element: HTMLDivElement,
  isFirstTime: boolean
): { parentIndex: number; childIndex: number } => {
  let parentIndex = currentParentIndex;
  let childIndex = currentChildIndex;

  if (isFirstTime) {
    focusElement(element, 0, 0);
    return;
  }

  if (childIndex > 0) {
    childIndex--;
  } else {
    if (parentIndex != 0) {
      parentIndex--;
      childIndex = data[parentIndex].items.length - 1;

      // childIndex--;
    } else {
      parentIndex = data.length - 1;
      childIndex = data[parentIndex].items.length - 1;
    }
  }
  focusElement(element, parentIndex, childIndex);
  return {
    parentIndex,
    childIndex
  };
};

const focusElement = (element: HTMLDivElement, parentIndex: number, childIndex: number) => {
  const allUl: HTMLCollection = element.children;
  const itemToFocus = allUl[parentIndex].children[childIndex + 1] as HTMLDivElement;
  itemToFocus.focus();
  itemToFocus.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};
