interface initialStateInterface {
  filteredData: filteredListInterface[];
  parentIndex?: number;
  childIndex?: number;
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
}

export const filterReducerInitialState: initialStateInterface = { filteredData: [], parentIndex: 0, childIndex: 0 };

export const filterReducer = (state: initialStateInterface, action: actionInterface) => {
  switch (action.type) {
    case 'arrowUp':
      return {
        ...state,
        ...decreaseIndex(state.filteredData, state.parentIndex, state.childIndex)
      };
    case 'arrowDown':
      return {
        ...state,
        ...increaseIndex(state.filteredData, state.parentIndex, state.childIndex)
      };
    case 'setFilteredData':
      return {
        ...state,
        filteredData: action.payload
      };
    case 'resetIndex':
      return {
        ...state,
        parentIndex: 0,
        childIndex: 0
      };
    default:
      throw new Error();
  }
};

const increaseIndex = (
  data: filteredListInterface[],
  currentParentIndex: number,
  currentChildIndex: number
): { parentIndex: number; childIndex: number } => {
  let parentIndex = currentParentIndex;
  let childIndex = currentChildIndex;

  if (childIndex < data[parentIndex]?.items.length) {
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

  return {
    parentIndex,
    childIndex
  };
};

const decreaseIndex = (
  data: filteredListInterface[],
  currentParentIndex: number,
  currentChildIndex: number
): { parentIndex: number; childIndex: number } => {
  let parentIndex = currentParentIndex;
  let childIndex = currentChildIndex;

  if (childIndex > 0) {
    childIndex--;
  } else {
    if (parentIndex != 0) {
      parentIndex--;
      childIndex = data[parentIndex].items.length - 1;

      childIndex--;
    } else {
      parentIndex = 0;
      childIndex = 0;
    }
  }

  return {
    parentIndex,
    childIndex
  };
};
