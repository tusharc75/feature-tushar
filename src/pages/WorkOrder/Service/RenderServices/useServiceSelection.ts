import { useCallback, useState } from 'react';

const useServiceSelection = () => {
  const [selectedServicesMap, setSelectedServicesMap] = useState<Map<string, any>>(new Map());

  const handleSelectService = useCallback((service: any) => {
    setSelectedServicesMap((prev) => {
      const selectedServices = new Map(prev);
      if (prev.has(service._id)) {
        selectedServices.delete(service._id);
      } else {
        selectedServices.set(service._id, service);
      }
      return selectedServices;
    });
  }, []);

  const isServiceSelected = useCallback(
    (service: any) => {
      return selectedServicesMap.has(service._id);
    },
    [selectedServicesMap]
  );

  // ModernBulkAction component adapter
  const dispatch = useCallback((payload: { type: 'selection'; selectedRecords: any[] }) => {
    setSelectedServicesMap(new Map());
  }, []);

  const selectedRecords = Array.from(selectedServicesMap.values());

  return {
    handleSelectService,
    isServiceSelected,
    selectedRecords,
    dispatch
  };
};

export default useServiceSelection;
