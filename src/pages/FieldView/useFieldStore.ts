import createFastContext from 'src/StateProvider/createFastContext';

type InitialState = {
  activeItem: string | null;
};
const initialState: InitialState = {
  activeItem: null
};

export const { Provider: FieldStoreProvider, useStore: useFieldStore } = createFastContext<InitialState>(initialState);
