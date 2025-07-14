import { ApiFormData } from 'src/components/InfoSidebar/types';
import createFastContext from 'src/StateProvider/createFastContext';

export type InfoSidebarState = {
  item: Partial<ApiFormData>;
  content: string;
};

const initialState: InfoSidebarState = {
  item: null,
  content: ''
};

export const { Provider: InfoSidebarProvider, useStore: useInforSidebar } = createFastContext(initialState);
