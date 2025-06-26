import { useEffect } from 'react';
import CardColTimeline from 'src/components/CardColTimeline1';
import { WORKORDER_SERVICE_STATUS, workOrderColormap } from 'src/constants/helpers';

const CardView = ({ filterQuery, setOnClickData, setOpen, state, headerSlot, renderedFrom }) => {
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
