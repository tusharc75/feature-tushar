import { DeveloperBoard, Map } from '@mui/icons-material';
import { Typography } from '@mui/material';

const CustomAntTabs = ({ value, setValue, tabs }) => {
  return (
    <div className="flex divide-y overflow-hidden rounded-md border">
      {tabs.map((tab, i) => (
        <button
          className="flex cursor-pointer items-center gap-2 border-none bg-transparent px-4 py-1.5 text-sm font-medium outline-none transition-colors first:rounded-l-md last:rounded-r-md hover:bg-gray-200 data-[selected=true]:bg-[--new-theme-color] data-[selected=true]:text-white dark:text-white dark:hover:bg-gray-700"
          data-selected={i === value}
          onClick={() => setValue(i)}
        >
          {tab === 'Board' ? <DeveloperBoard /> : <Map />}
          {tab}
        </button>
      ))}
      <Typography />
    </div>
  );
};

export default CustomAntTabs;
