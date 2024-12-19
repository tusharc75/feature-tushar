import { WORKORDER_SERVICE_STATUS } from 'src/constants/helpers';

export const colormap = {
  [WORKORDER_SERVICE_STATUS.pending]: { color: 'text-[#CA8A04]', background: 'bg-[#F6F2E2]', indicator: 'bg-[#EEBA6C]' },
  [WORKORDER_SERVICE_STATUS.inProgress]: { color: 'text-[#3772FF]', background: 'bg-[#3772FF33]', indicator: 'bg-[#0095FF]' },
  [WORKORDER_SERVICE_STATUS.completed]: { color: 'text-[#0FBE00]', background: 'bg-[#0FBE0033]', indicator: 'bg-[#03781D]' }
};
