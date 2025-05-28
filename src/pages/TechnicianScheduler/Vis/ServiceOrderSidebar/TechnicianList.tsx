import { Box, Button, IconButton, Skeleton } from '@mui/material';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { VariableSizeList as List } from 'react-window';
import { TActios, TInitialState } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn, displayDate } from 'src/constants/helpers';
import { throttle } from 'src/hooks/useThrottle';
import { useRoadMapStore } from 'src/pages/TechnicianScheduler/Store';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';

type TechnicianListProps = {
  state: TInitialState;
  dispatch: React.Dispatch<TActios>;
  selectedResource: TechnicianResource;
  container: HTMLDivElement | null;
  isMobile: boolean;
  viewType: string;
  setOpenTechnicianDialog: React.Dispatch<React.SetStateAction<any>>;
};

const TechnicianList = ({ dispatch, state, selectedResource, container, isMobile, viewType, setOpenTechnicianDialog }: TechnicianListProps) => {
  const listRef = useRef<List<any>>(null);
  const sizeMap = useRef({});
  const [containerSize, setContainerSize] = useState({ width: 300 - 16, height: isMobile ? 150 : 600 });

  useEffect(() => {
    const throttledCalc = throttle(() => {
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }, 2000);

    const handleResize = () => {
      throttledCalc();
    };
    handleResize();
    container?.addEventListener('resize', handleResize);
    return () => {
      container?.addEventListener('resize', handleResize);
    };
  }, [container]);

  const setSize = useCallback((index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef?.current?.resetAfterIndex(index);
  }, []);

  const getSize = useCallback((index) => sizeMap.current[index] || 50, []);

  return (
    <div
      style={{ height: isMobile ? 'auto' : containerSize.height }}
      className={cn(state.loading ? 'overflow-hidden' : '', isMobile ? 'overflow-y-hidden' : '')}
    >
      {state.loading ? (
        <div className={cn('flex', isMobile ? 'flex-row' : 'flex-col')}>
          {[...Array(6).keys()].map((i) => (
            <RowSkeleton key={i} isMobile={isMobile} />
          ))}
        </div>
      ) : state?.dataRows?.length ? (
        <List
          ref={listRef}
          height={isMobile ? containerSize.height : containerSize.height}
          width={containerSize.width}
          itemCount={state.dataRows?.length}
          layout={isMobile ? 'horizontal' : 'vertical'}
          style={isMobile ? { overflowY: 'hidden' } : { overflowX: 'hidden' }}
          itemSize={getSize}
          itemData={state.dataRows}
        >
          {({ data, index, style }) => (
            <div style={style}>
              <SingleRow
                row={data[index]}
                index={index}
                setSize={setSize}
                isMobile={isMobile}
                selectedType={selectedResource?.key}
                setOpenTechnicianDialog={setOpenTechnicianDialog}
                viewType={viewType}
              />
            </div>
          )}
        </List>
      ) : (
        <>
          <Box p={1}>
            <p>No Data Found</p>
          </Box>
        </>
      )}
    </div>
  );
};

export default TechnicianList;

const RowSkeleton = ({ isMobile }) => {
  return (
    <div className={cn('', isMobile ? 'w-[300px] flex-shrink-0 px-1' : 'px-4 pb-3')}>
      <div className="space-y-2 rounded-md border p-3 shadow-lg">
        {[...Array(4).keys()].map((i) => (
          <div className="flex items-center justify-between " key={i}>
            <h6 className="text-[10px] font-medium text-gray-500">
              <Skeleton width={Math.random() * (90 - 40) + 40} />
            </h6>
            <p className="text-[13px]">
              <Skeleton width={Math.random() * (150 - 100) + 100} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SingleRow = memo(({ row, index, setSize, selectedType, className = '', isMobile, setOpenTechnicianDialog, viewType }: any) => {
  const [activeItemData, setStore] = useRoadMapStore((state) => state.activeItemData);
  const rowRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const rect = rowRef?.current.getBoundingClientRect();
    setSize(index, isMobile ? 300 : rect?.height);
  }, [setSize, index, isMobile]);

  const columns = useMemo(() => {
    return [
      {
        id: 'resourceNumber',
        head: 'Job Number',
        cell: row['resourceNumber'] ? (
          <div className="flex items-center ">
            <p title={row.resourceNumber} className="line-clamp-1">
              {row.resourceNumber}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(
                  `${selectedType === 'fieldTicket' ? routes.fieldTicketDetail.path : selectedType === 'fieldServiceOrder' ? routes.fieldServiceOrderDetail.path : routes.rentalManagementDetail.path}/${row.resourceId}`
                );
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
      },
      {
        id: 'customerAccount',
        head: 'Customer',
        cell: row?.customerAccount ? (
          <div className="flex items-center">
            <p title={row?.customerAccount} className="line-clamp-1">
              {row?.customerAccount}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.customerAccountDetail.path}/${row?.customerAccountId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
      },
      ...(viewType === 'service'
        ? [
            {
              id: 'serviceName',
              head: 'Service',
              cell:
                row.serviceName && row.serviceId ? (
                  <div className="flex items-center">
                    <p title={row.serviceName} className="line-clamp-1">
                      {row.serviceName}
                    </p>
                    <IconButton
                      size="small"
                      onClick={() => {
                        window.open(`${routes.serviceMasterDetail.path}/${row.serviceId}`);
                      }}
                    >
                      <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                    </IconButton>
                  </div>
                ) : (
                  <NoDataCell />
                )
            }
          ]
        : []),
      {
        id: 'estimateStartDate',
        head: 'Estimate Start Date',
        cell: row['estimateStartDate'] ? <p className="text-truncate">{displayDate(row.estimateStartDate)}</p> : <NoDataCell />
      },
      {
        id: 'estimateEndDate',
        head: 'Estimate End Date',
        cell: row['estimateEndDate'] ? <p className="text-truncate">{displayDate(row.estimateEndDate)}</p> : <NoDataCell />
      }
    ];
  }, [row, selectedType, viewType]);

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = 'move';
    const data = {
      id: row._id,
      index: index,
      row,
      props: { row, index, setSize, selectedType, isMobile, type: 'sidebar' },
      type: 'sidebar',
      start: new Date(),
      end: new Date(1000 * 60 * 10 + new Date().valueOf())
    };
    event.dataTransfer.setData('text', JSON.stringify(data));
    // event.target.addEventListener('dragend', handleDragEnd.bind(this), false);
  }

  // function handleDragEnd(event) {
  //   // Last item that just been dragged, its ID is the same of event.target
  //   console.log(event, event.target.id, event.dataTransfer);
  // }

  return (
    <div
      ref={(div) => {
        // setDroppableRef(div);
        rowRef.current = div;
      }}
      onClick={() => {
        setStore({ activeItemData: activeItemData?.data?._id === row._id ? null : { data: row, type: 'sidebar' } });
      }}
      className={cn(
        isMobile ? 'w-[300px] px-1' : 'px-4 pb-3'
        // isDragging ? (isMobile ? 'hidden' : '!w-0 overflow-hidden p-0') : ''
      )}
    >
      <div draggable onDragStart={handleDragStart} className={cn(isMobile ? '' : 'w-[262px]')}>
        <div
          className={cn(
            'cursor-grab space-y-2 rounded-md border  p-3 shadow-lg transition-all duration-300',
            activeItemData?.data?._id === row._id ? 'cursor-pointer [box-shadow:0px_0px_0px_2px_var(--new-theme-color)_inset]' : '',
            'bg-[--dark-secondary,white]',
            // isOver && active.data.current?.type === 'technician' ? 'bg-gray-300 dark:bg-gray-800' : 'bg-[--dark-secondary,white]',
            className
          )}
        >
          {columns.map((col) => (
            <div key={col.id} className="flex items-center justify-between gap-1">
              <h6 className={cn('text-[10px] font-medium text-gray-500', isMobile ? 'line-clamp-1' : '')}>{col.head}:</h6>
              <p className={cn('text-[13px]', isMobile ? 'line-clamp-1' : '')}>{col.cell}</p>
            </div>
          ))}
          <div className="">
            <Button
              size="small"
              variant="outlined"
              fullWidth
              className="text-sm"
              sx={{ fontSize: '11px' }}
              onClick={() => {
                setOpenTechnicianDialog({ open: true, data: row });
              }}
            >
              Assign Technicians
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
