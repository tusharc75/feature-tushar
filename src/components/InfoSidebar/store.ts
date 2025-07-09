import { ApiFormData } from 'src/components/InfoSidebar/types';
import createFastContext from 'src/StateProvider/createFastContext';

export type InfoSidebarState = {
  item?: Partial<ApiFormData>;
};

const initialState: InfoSidebarState = {
  item: null
};

export const { Provider: InfoSidebarProvider, useStore: useInforSidebar } = createFastContext(initialState);
