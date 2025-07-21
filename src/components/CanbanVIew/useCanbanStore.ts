import { InitialState } from 'src/components/CanbanVIew/types';
import createFastContext from 'src/StateProvider/createFastContext';

const initialState: InitialState<any> = {
  columns: null,
  pivotColumn: null
};

export const { Provider: CanbanStoreProvider, useStore: useCanbanStore } = createFastContext<InitialState<any>>(initialState);
