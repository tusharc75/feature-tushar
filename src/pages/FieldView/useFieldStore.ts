import createFastContext from 'src/StateProvider/createFastContext';

type InitialState = {
  activeItem: string | null;
  availableLocations: Record<string, { lat: number; lng: number }>;
};
const initialState: InitialState = {
  activeItem: null,
  availableLocations: {}
};

export const { Provider: FieldStoreProvider, useStore: useFieldStore } = createFastContext<InitialState>(initialState);
