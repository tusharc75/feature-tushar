import { Box, Button, IconButton, Skeleton } from '@mui/material';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { VariableSizeList as List } from 'react-window';
import axiosInstance from 'src/axios/axiosInstance';
import { TInitialState } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn, displayDate } from 'src/constants/helpers';
import { throttle } from 'src/hooks/useThrottle';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { handleDragPreview } from 'src/pages/TechnicianScheduler/Vis/utils';

type TechnicianListProps = {
  state: TInitialState;
  selectedResource: TechnicianResource;
  container: HTMLDivElement | null;
  isMobile: boolean;
  viewType: string;
};

const TechnicianList = ({ state, selectedResource, container, isMobile, viewType }: TechnicianListProps) => {
  const listRef = useRef<List<any>>(null);
  const sizeMap = useRef({});
  const [containerSize, setContainerSize] = useState({ width: 300 - 16, height: isMobile ? 150 : 600 });

  const [fieldLabels, setFieldLabels] = useState([]);

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

  useEffect(() => {
    if (selectedResource) {
      fetchColumn()
    }
  }, [selectedResource]);

  const fetchColumn = async () => {
    const { data: { data } } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: selectedResource.resource,
          fieldNames: ['customerAccount', 'estimateStartDate', 'estimateEndDate']
        }
      ]
    });
    if (data?.length) {
      setFieldLabels(data[0]?.fieldNames)
    }
  }

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
                fieldLabels={fieldLabels}
                index={index}
                setSize={setSize}
                isMobile={isMobile}
                selectedResource={selectedResource}
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
    <div className={cn('', isMobile ? 'w-[300px] flex-shrink-0 px-1' : 'px-1 pb-3')}>
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

export const SingleRow = memo(({ row, index, fieldLabels, setSize, selectedResource, className = '', isMobile, viewType }: any) => {
  const [activeItemData, setStore] = useTimelineStore((state) => state.activeItemData);

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
                window.open(`${selectedResource?.path}/${row.resourceId}`);
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
        head: fieldLabels?.find((e) => e?.fieldName === 'customerAccount')?.fieldLabel || 'Customer Account',
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
        head: fieldLabels?.find((e) => e?.fieldName === 'estimateStartDate')?.fieldLabel || 'Estimate Start Date',
        cell: row['estimateStartDate'] ? <p className="text-truncate">{displayDate(row.estimateStartDate)}</p> : <NoDataCell />
      },
      {
        id: 'estimateEndDate',
        head: fieldLabels?.find((e) => e?.fieldName === 'estimateEndDate')?.fieldLabel || 'Estimate End Date',
        cell: row['estimateEndDate'] ? <p className="text-truncate">{displayDate(row.estimateEndDate)}</p> : <NoDataCell />
      }
    ];
  }, [row, selectedResource, viewType]);

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = 'move';
    const data = {
      id: row._id,
      data: row,
      from: 'sidebar'
    };
    setStore({ activeItemData: { data: row, type: 'sidebar' } });
    event.dataTransfer.setData('text/plain', JSON.stringify(data));
    handleDragPreview(event, () => setStore({ activeItemData: null }), { opacity: 1 });
  }

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
        isMobile ? 'w-[300px] px-1' : 'px-1 pb-3'
        // isDragging ? (isMobile ? 'hidden' : '!w-0 overflow-hidden p-0') : ''
      )}
    >
      <div draggable onDragStart={handleDragStart} className={cn('dragElement', isMobile ? '' : '')}>
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
              onClick={(e) => {
                e.stopPropagation();
                setStore({ openTechnicianDialog: { open: true, data: row } });
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
