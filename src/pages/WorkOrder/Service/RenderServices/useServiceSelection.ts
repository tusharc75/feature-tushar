import { useCallback, useState } from 'react';

const useServiceSelection = () => {
  const [selectedServicesMap, setSelectedServicesMap] = useState<Map<string, any>>(new Map());

  const unselectAll = useCallback(() => {
    setSelectedServicesMap(new Map());
  }, []);

  const handleSelectService = useCallback((service: any) => {
    if (!service?.clickable) return;
    setSelectedServicesMap((prev) => {
      const selectedServices = new Map(prev);
      if (prev.has(service.uniqueId)) {
        selectedServices.delete(service.uniqueId);
      } else {
        selectedServices.set(service.uniqueId, service);
      }
      return selectedServices;
    });
  }, []);

  const handleSelectMultiple = useCallback((checked: boolean, services: any[]) => {
    setSelectedServicesMap((prev) => {
      const selectedServices = new Map(prev);
      services.forEach((s) => {
        if (s?.clickable) {
          if (checked) {
            selectedServices.set(s.uniqueId, s);
          } else {
            selectedServices.delete(s.uniqueId);
          }
        }
      });

      return selectedServices;
    });
  }, []);

  const isGroupSelected = useCallback(
    (services: any[]) => {
      const selectableServices = services.filter((d) => d.clickable);
      return selectableServices.every((d) => selectedServicesMap.has(d.uniqueId));
    },
    [selectedServicesMap]
  );

  const isGroupIndeterminate = useCallback(
    (services: any[]) => {
      const selectableServices = services.filter((d) => d.clickable);
      const isAllSelectedInGroup = isGroupSelected(services);
      const isSomeSelected = selectableServices.some((d) => selectedServicesMap.has(d.uniqueId));
      return isSomeSelected && !isAllSelectedInGroup;
    },
    [selectedServicesMap, isGroupSelected]
  );

  const isServiceSelected = useCallback(
    (service: any) => {
      return selectedServicesMap.has(service.uniqueId);
    },
    [selectedServicesMap]
  );

  // adapter for ModernBulkAction component
  const dispatch = useCallback((payload: { type: 'selection'; selectedRecords: any[] }) => {
    setSelectedServicesMap(new Map());
  }, []);

  const selectedRecords = Array.from(selectedServicesMap.values());

  return {
    handleSelectService,
    isServiceSelected,
    handleSelectMultiple,
    isGroupIndeterminate,
    isGroupSelected,
    selectedRecords,
    dispatch,
    unselectAll
  };
};

export default useServiceSelection;
