import { useEffect } from 'react';
import CardColTimeline from 'src/components/CardColTimeline1';
import { workOrderColormap } from 'src/constants/helpers';
import CardCustomComponent from 'src/pages/WorkOrderTechnician/CardView/CardCustomComponent';

const CardView = ({ filterQuery, setSelectedService, setServiceOpen, state, headerSlot, renderedFrom, childColumns }) => {
  const { setFilterQuery } = state;

  useEffect(() => {
    if (filterQuery?.length > 0) {
      let query = `&filterType=and`;

      if (filterQuery?.length > 0) {
        query = `${query}&filterById=${JSON.stringify(filterQuery)}`;
      }
      setFilterQuery(query);
    } else {
      setFilterQuery('');
    }
  }, [filterQuery]);

  return (
    <>
      <CardColTimeline
        renderedFrom={renderedFrom}
        headerSlot={headerSlot}
        getColColors={(colName) => workOrderColormap[colName]}
        state={state}
        passFailStatus={true}
        passFailAccessor="serviceStatus"
        customContent={(props) => <CardCustomComponent {...props} renderedFrom={renderedFrom} columns={childColumns} />}
        subItemAccessor={(data) => data.services}
        getChildId={(child) => child._id}
        cardOnClick={(data: any) => {
          let tempServiceData = {};
          tempServiceData['uniqueId'] = data?.uniqueId;
          tempServiceData['workOrderId'] = data?.workOrderId;
          tempServiceData['canPerform'] = data?.canPerform;
          setSelectedService(tempServiceData);
          setServiceOpen(true);
        }}
      />
    </>
  );
};

export default CardView;
