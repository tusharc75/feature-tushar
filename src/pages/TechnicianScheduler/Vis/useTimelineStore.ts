import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import { Activity } from 'src/pages/TechnicianScheduler/Vis/types';
import createFastContext from 'src/StateProvider/createFastContext';

export type TimelineStore = {
  activeItemData: { type: 'technician' | 'sidebar'; data: any };
  leftSearchValue: string;
  technicianSearchValue: string;
  mapData: string[] | null;
  assignTechnicianDialog: { open: boolean; technicianData: Activity | null; service: any | null };
  unAssignTechnicianDialog: { open: boolean; id: string | null };
  startEndDateConfirmationDialog: {
    open: boolean;
    type: 'stop' | 'start' | null;
    referenceId: string | null;
    minDateTime: Date | string | null;
    notes: string | null;
    _id: string | null;
  };
  assignServiceDialog: { open: boolean; data: Activity | null };
  selectedResource: TechnicianResource | null;
};
const initialState: TimelineStore = {
  activeItemData: null,
  leftSearchValue: '',
  technicianSearchValue: '',
  mapData: null,
  assignTechnicianDialog: { open: false, technicianData: null, service: null },
  unAssignTechnicianDialog: { open: false, id: null },
  startEndDateConfirmationDialog: { open: false, type: null, referenceId: null, minDateTime: null, notes: '', _id: null },
  assignServiceDialog: { open: false, data: null },
  selectedResource: null
};

const { Provider, useStore } = createFastContext<TimelineStore>(initialState);

export { Provider as TimlineProvider, useStore as useTimelineStore };
