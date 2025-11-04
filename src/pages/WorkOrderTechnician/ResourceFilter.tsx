import { Autocomplete, TextField } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import AsyncDropDown from 'src/components/Helpers/FormTypes/AsyncDropdown';
import { sidebarResource } from 'src/constants/helpers';
import { getResourcePolicy } from 'src/pages/DynamicForm/helper';
import { useData } from 'src/StateProvider/Provider';

const ResourceFilter = ({ selectedResource, setSelectedResource, filterByIds, setFilterByIds, handleApplyFilter }) => {
  const {
    state: { user, resources, permissions }
  }: any = useData();

  const [resourcePolicyData, setResourcePolicyData] = useState(null)

  useEffect(() => {
    fetchPolicy()
  }, [])
  const fetchPolicy = async () => {
    const data = await getResourcePolicy(user, permissions, sidebarResource.rentalManagement);
    setResourcePolicyData(data);
  };

  const RESOURCE_LIST = useMemo(() => {
    const data = [
      {
        key: 'assemblyOrder',
        resource: sidebarResource.assemblyOrder,
        title: resources?.assemblyOrder?.titleSingular
      },
      {
        key: 'productionOrder',
        resource: sidebarResource.productionOrder,
        title: resources?.productionOrder?.titleSingular
      },
      {
        key: 'repairOrder',
        resource: sidebarResource.repairOrder,
        title: resources?.repairOrder?.titleSingular
      },
      ...(resourcePolicyData?.policy?.autoCreateWorkOrderOnQuotationApproval ? [
        {
          key: 'rentalJob',
          resource: sidebarResource.rentalManagement,
          title: resources?.rentalManagement?.titleSingular
        },
      ] : [])
    ];
    const options: any = [];
    data?.forEach((item) => {
      if (permissions[item.key === 'rentalJob' ? 'rentalManagement' : item.key]) {
        options.push(item);
      }
    });
    return options;
  }, [permissions, resourcePolicyData]);

  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  useEffect(() => {
    if (RESOURCE_LIST?.length === 1 && !selectedResource) {
      setSelectedResource(RESOURCE_LIST[0]);
    }
  }, [RESOURCE_LIST, selectedResource, setSelectedResource]);

  useEffect(() => {
    let filterById = [...filterByIds];
    filterById = filterById?.filter((e) => ![...RESOURCE_LIST?.map(e => e?.key), '_id'].includes(e?.field));
    if (selectedResourceData) {
      filterById = [...filterById, { field: selectedResource?.key, term: [selectedResourceData] }];
    }
    setFilterByIds(filterById);
    handleApplyFilter(filterById);
  }, [selectedResourceData]);

  useEffect(() => {
    if (selectedWorkOrder) {
      let filterById = [...filterByIds];
      filterById = filterById?.filter((e) => e?.field !== '_id');

      if (selectedWorkOrder) {
        filterById = [...filterById, { field: '_id', term: [selectedWorkOrder] }];
      }
      setFilterByIds(filterById);
      handleApplyFilter(filterById);
    }
  }, [selectedWorkOrder]);

  return (
    <>
      {RESOURCE_LIST?.length > 1 && (
        <Autocomplete
          options={RESOURCE_LIST}
          getOptionLabel={(option: any) => option?.title || ''}
          isOptionEqualToValue={(option: any, value: any) => option?.title === value?.title}
          fullWidth
          style={{ maxWidth: '270px' }}
          value={selectedResource}
          onChange={(event, newValue) => {
            setSelectedResource(newValue);
            setSelectedResourceData(null);
            setSelectedWorkOrder(null);
          }}
          size="small"
          renderInput={(params) => <TextField {...params} margin="none" label={`Resource`} variant="outlined" />}
        />
      )}
      {selectedResource && (
        <div style={{ width: '270px' }}>
          <AsyncDropDown
            resource={selectedResource.resource}
            multiple={false}
            errors={false}
            touched={false}
            value={selectedResourceData}
            fieldLabel={`${selectedResource?.title}`}
            onChange={(e, val) => {
              setSelectedResourceData(val);
              setSelectedWorkOrder(null);
            }}
            fieldName={''}
            required={false}
            disableCloseOnSelect={false}
          />
        </div>
      )}
      {selectedResourceData && selectedResource && (
        <div style={{ width: '270px' }}>
          <AsyncDropDown
            resource={sidebarResource.workOrder}
            multiple={false}
            errors={false}
            touched={false}
            value={selectedWorkOrder}
            fieldLabel={`${resources?.workOrder?.titleSingular}`}
            onChange={(e, val) => {
              setSelectedWorkOrder(val);
            }}
            fieldName={''}
            required={false}
            disableCloseOnSelect={false}
            lookupDependentOn={selectedResource.key}
            resourceOfLookupDependentOn={sidebarResource.workOrder}
            lookupDependentOnValue={selectedResourceData?.optionValue}
          />
        </div>
      )}
    </>
  );
};

export default ResourceFilter;
