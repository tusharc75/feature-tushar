import { useEffect } from 'react';
import CardColTimeline from 'src/components/CardColTimeline1';
import { WORKORDER_SERVICE_STATUS, workOrderColormap } from 'src/constants/helpers';
import CardCustomComponent from 'src/pages/WorkOrderTechnician/CardView/CardCustomComponent';

const CardView = ({ filterQuery, setOnClickData, setOpen, state, headerSlot, renderedFrom, childColumns }) => {
  const { setFilterQuery } = state;

  useEffect(() => {
    if (filterQuery?.length > 0) {
      setFilterQuery(filterQuery);
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
        customContent={(props) => <CardCustomComponent {...props} renderedFrom={renderedFrom} columns={childColumns} />}
        state={state}
        passFailStatus={true}
        passFailAccessor="serviceStatus"
        cardOnClick={(data: any) => {
          if (data?.status != WORKORDER_SERVICE_STATUS.planned) {
            setOnClickData({ workOrderId: data?.workOrderId });
            setOpen(true);
          }
        }}
      />
    </>
  );
};

export default CardView;
