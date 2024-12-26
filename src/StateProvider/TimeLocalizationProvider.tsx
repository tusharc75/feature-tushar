import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useData } from 'src/StateProvider/Provider';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

const TimezoneLocalizationProvider = ({ children }) => {

  const {
    state: { user }
  }: any = useData();

  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(relativeTime);
  dayjs.extend(customParseFormat);
  dayjs.extend(isSameOrAfter);
  dayjs.extend(advancedFormat);
  dayjs.extend(localizedFormat);
  dayjs.tz.setDefault(user?.user?.timezone || 'America/New_York');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {children}
    </LocalizationProvider>
  );
};

export default TimezoneLocalizationProvider;