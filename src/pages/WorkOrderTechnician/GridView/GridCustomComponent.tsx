import React, { useEffect } from 'react';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useEffectEvent } from 'src/hooks/useEffectEvent';

type CustomContentProps = {
  row: any;
  height: number;
  renderedFrom: string;
  columns: TColType[];
};

const GridCustomComponent = React.memo(
  ({ row, height, renderedFrom, columns }: CustomContentProps) => {
    const { state, dispatch } = useTableReducer({ renderedFrom });

    const getData = useEffectEvent(() => {
      dispatch({ type: 'initialize', data: row.services, count: row?.services?.length });
      dispatch({ type: 'loading', loading: false });
    });

    useEffect(() => {
      getData();
    }, [getData]);

    return (
      <>
        <div className="max-w-full">
          {columns ? (
            <>
              <CustomReactTable
                showTableHead={false}
                height={`${height}px`}
                columns={columns}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                hideSelection={false}
                expander={false}
              />
            </>
          ) : (
            <div>
              <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
            </div>
          )}
        </div>
      </>
    );
  },
  (prev, next) => prev.row?._id === next.row?._id
);

export default GridCustomComponent;
