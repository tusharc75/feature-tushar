import { useCallback, useState } from 'react';
import SingleMobileTechnician from 'src/pages/TechnicianScheduler/Vis/MobileRoadmap/SingleTechnician';
import { Activity } from 'src/pages/TechnicianScheduler/Vis/types';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';

const COLLAPSIBLE_UNIQUE_NAME = '_fieldTicketInvoice';

const Technicians = ({ activity, handleSelect }) => {
  const [open, setOpen] = useState<string | false>(false);
  const [, setStore] = useTimelineStore((state) => state.mapData);

  const handleChange = useCallback((index: string | number) => {
    const newIndex = `${index}${COLLAPSIBLE_UNIQUE_NAME}`;
    setOpen((prev) => (!prev ? newIndex : prev === newIndex ? false : newIndex));
  }, []);

  const compareCollapse = useCallback(
    (index: number | string) => {
      const newIndex = `${index}${COLLAPSIBLE_UNIQUE_NAME}`;
      return open === newIndex;
    },
    [open]
  );

  const handleMapClick = useCallback(
    (index: number, item: Activity) => {
      const newIndex = `${index}${COLLAPSIBLE_UNIQUE_NAME}`;
      setStore({ mapData: [item?.user?.optionValue] });
      setOpen(newIndex);
    },
    [setStore]
  );

  return (
    <ul>
      {activity?.map((item, index) => {
        return (
          <SingleMobileTechnician
            compareCollapse={compareCollapse}
            handleChange={handleChange}
            handleMapClick={handleMapClick}
            handleSelect={handleSelect}
            index={index}
            item={item}
            key={item._id}
          />
        );
      })}
    </ul>
  );
};

export default Technicians;
