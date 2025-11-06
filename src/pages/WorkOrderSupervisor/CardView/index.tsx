import { camelCase } from 'lodash';
import { useCallback, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CardColTimeline from 'src/components/CardColTimeline';
import { WORKORDER_SERVICE_STATUS, workOrderColormap, workOrderSupervisor } from 'src/constants/helpers';
import CardCustomComponent from 'src/pages/WorkOrderTechnician/CardView/CardCustomComponent';

const groupByButtonItems = [{ optionLabel: 'Assembly Orders', optionValue: 'Assembly Order' }];

const CardView = ({ filterQuery, setOnClickData, setOpen, state, headerSlot, renderedFrom, childColumns, bulkActionItems, selectedResource }) => {
  const { setFilterQuery } = state;

  useEffect(() => {
    if (filterQuery?.length > 0) {
      setFilterQuery(filterQuery);
    } else {
      setFilterQuery('');
    }
  }, [filterQuery]);

  const fetchGroupData = useCallback(async (resource: string) => {
    try {
      const data = await axiosInstance().get(`${workOrderSupervisor.api}/resource-wise-count`, {
        params: {
          resource
        }
      });
      return data.data.data.map((d) => ({ optionLabel: d.optionLabel, optionValue: d.optionValue, count: d['workOrderCount'] }));
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <>
      <CardColTimeline
        renderedFrom={renderedFrom}
        bulkActionItems={bulkActionItems}
        headerSlot={headerSlot}
        getColColors={(colName) => workOrderColormap[colName]}
        customContent={(props) => <CardCustomComponent {...props} renderedFrom={renderedFrom} columns={childColumns} />}
        state={state}
        passFailStatus={true}
        passFailAccessor="serviceStatus"
        subItemAccessor={(data) => data?.services}
        getChildId={(child) => child?._id}
        cardOnClick={(data: any) => {
          if (data?.status !== WORKORDER_SERVICE_STATUS.planned) {
            setOnClickData({ workOrderId: data?.workOrderId });
            setOpen(true);
          }
        }}
        groupByApiKey="groupId"
        groupByButtonItems={[selectedResource].map((d) => ({ optionLabel: d.label, optionValue: d.value }))}
        fetchGroupData={fetchGroupData}
      />
    </>
  );
};

export default CardView;
