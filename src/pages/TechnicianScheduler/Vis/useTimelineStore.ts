import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import { Activity, Service } from 'src/pages/TechnicianScheduler/Vis/types';
import createFastContext from 'src/StateProvider/createFastContext';

export type TimelineStore = {
  activeItemData: { type: 'technician' | 'sidebar'; data: any };
  leftSearchValue: string;
  mapData: string[] | null;
  assignTechnicianDialog: { open: boolean; technicianData: Activity[] | null; service: Service | null };
  unAssignTechnicianDialog: { open: boolean; id: string | null };
  openTechnicianDialog: { open: boolean; data: Service | null };
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
  mapData: null,
  assignTechnicianDialog: { open: false, technicianData: null, service: null },
  unAssignTechnicianDialog: { open: false, id: null },
  startEndDateConfirmationDialog: { open: false, type: null, referenceId: null, minDateTime: null, notes: '', _id: null },
  assignServiceDialog: { open: false, data: null },
  selectedResource: null,
  openTechnicianDialog: { open: false, data: null }
};

const { Provider, useStore } = createFastContext<TimelineStore>(initialState);

export { Provider as TimlineProvider, useStore as useTimelineStore };
