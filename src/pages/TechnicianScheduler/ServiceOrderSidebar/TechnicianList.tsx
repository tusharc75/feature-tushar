import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { IconButton, Skeleton } from '@mui/material';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { VariableSizeList as List } from 'react-window';
import { TActios, TInitialState } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn, displayDate } from 'src/constants/helpers';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';

type TechnicianListProps = {
  state: TInitialState;
  setSelectedRecords: React.Dispatch<React.SetStateAction<any[]>>;
  dispatch: React.Dispatch<TActios>;
  selectedResource: TechnicianResource;
  container: HTMLDivElement | null;
};

const TechnicianList = ({ dispatch, setSelectedRecords, state, selectedResource, container }: TechnicianListProps) => {
  const listRef = useRef<List<any>>(null);
  const sizeMap = useRef({});
  const containerSize = useMemo(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    } else {
      return { width: 300 - 16, height: 600 };
    }
  }, [container]);

  const setSize = useCallback((index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef?.current?.resetAfterIndex(index);
  }, []);

  const getSize = useCallback((index) => sizeMap.current[index] || 50, []);

  return (
    <div style={{ height: containerSize.height - 32 }} className={cn('py-4', state.loading ? 'overflow-hidden' : '')}>
      {state.loading ? (
        [...Array(6).keys()].map((i) => <RowSkeleton key={i} />)
      ) : (
        <List
          ref={listRef}
          height={containerSize.height - 32}
          width={containerSize.width}
          itemCount={state.dataRows?.length}
          style={{ overflowX: 'hidden' }}
          itemSize={getSize}
          itemData={state.dataRows}
        >
          {({ data, index, style }) => (
            <div style={style}>
              <SingleRow row={data[index]} index={index} setSize={setSize} selectedType={selectedResource?.key} />
            </div>
          )}
        </List>
      )}
    </div>
  );
};

export default TechnicianList;

const RowSkeleton = () => {
  return (
    <div className="px-4 pb-3">
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

export const SingleRow = memo(({ row, index, setSize, selectedType, className = '' }: any) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: row._id,
    data: {
      index: index,
      row,
      props: { row, index, setSize, selectedType }
    }
  });

  React.useEffect(() => {
    setSize(index, rowRef?.current.getBoundingClientRect().height);
  }, [setSize, index]);

  const columns = useMemo(() => {
    return [
      {
        id: 'resourceNumber',
        head: selectedType === 'fieldTicket' ? 'Field Ticket' : selectedType === 'fieldServiceOrder' ? 'Field Service Order' : 'Rental Job',
        cell: row['resourceNumber'] ? (
          <div className="flex items-center ">
            <p title={row.resourceNumber}>{row.resourceNumber}</p>
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
        id: 'serviceName',
        head: 'Service Name',
        cell:
          row.serviceName && row.serviceId ? (
            <div className="flex items-center">
              <p title={row.serviceName}>{row.serviceName}</p>
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
      },
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
  }, [row, selectedType]);

  const styleDnd = {
    transform: CSS.Translate.toString(transform)
  };

  return (
    <div
      {...attributes}
      {...listeners}
      ref={(div) => {
        rowRef.current = div;
        setNodeRef(div);
      }}
      style={styleDnd}
      className="px-4 pb-3"
    >
      <div className={cn('cursor-grab space-y-2 rounded-md border bg-[--dark-secondary,white] p-3 shadow-lg', className)}>
        {columns.map((col) => (
          <div key={col.id} className="flex items-center justify-between gap-1">
            <h6 className="text-[10px] font-medium text-gray-500">{col.head}:</h6>
            <p className="text-[13px]">{col.cell}</p>
          </div>
        ))}
      </div>
    </div>
  );
});
