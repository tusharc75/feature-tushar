import { ColumnFiltersState } from '@tanstack/react-table';
import createFastContext from 'src/StateProvider/createFastContext';

type InitialValue = {
  columnFilters: Record<string, ColumnFiltersState>;
};

const initialValue: InitialValue = {
  columnFilters: {}
};

export const { Provider: StoreClientFilterProvider, useStore: useStoreClientFilter } = createFastContext(initialValue);
