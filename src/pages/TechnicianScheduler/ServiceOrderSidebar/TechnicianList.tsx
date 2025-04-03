import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Button, IconButton, Skeleton } from '@mui/material';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { VariableSizeList as List } from 'react-window';
import { TActios, TInitialState } from 'src/components/CustomReactTable';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import RippleButton from 'src/components/RippleButton';
import { cn, displayDate } from 'src/constants/helpers';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';

type TechnicianListProps = {
  state: TInitialState;
  setSelectedRecords: React.Dispatch<React.SetStateAction<any[]>>;
  dispatch: React.Dispatch<TActios>;
  selectedResource: TechnicianResource;
  container: HTMLDivElement | null;
  isMobile: boolean;
  setOpenTechnicianDialog: React.Dispatch<React.SetStateAction<any>>;
};

const TechnicianList = ({
  dispatch,
  setSelectedRecords,
  state,
  selectedResource,
  container,
  isMobile,
  setOpenTechnicianDialog
}: TechnicianListProps) => {
  const listRef = useRef<List<any>>(null);
  const sizeMap = useRef({});
  const containerSize = useMemo(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    } else {
      return { width: 300 - 16, height: isMobile ? 150 : 600 };
    }
  }, [container, isMobile]);

  const setSize = useCallback((index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef?.current?.resetAfterIndex(index);
  }, []);

  const getSize = useCallback((index) => sizeMap.current[index] || 50, []);

  return (
    <div
      style={{ height: isMobile ? 'auto' : containerSize.height - 32 }}
      className={cn('py-4', state.loading ? 'overflow-hidden' : '', isMobile ? 'overflow-y-hidden' : '')}
    >
      {state.loading ? (
        <div className={cn('flex', isMobile ? 'flex-row' : 'flex-col')}>
          {[...Array(6).keys()].map((i) => (
            <RowSkeleton key={i} isMobile={isMobile} />
          ))}
        </div>
      ) : (
        <List
          ref={listRef}
          height={isMobile ? containerSize.height - 32 : containerSize.height - 32}
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
              />
            </div>
          )}
        </List>
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

export const SingleRow = memo(({ row, index, setSize, selectedType, className = '', isMobile, setOpenTechnicianDialog }: any) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: row._id,
    data: {
      index: index,
      row,
      props: { row, index, setSize, selectedType, isMobile, type: 'sidebar' },
      type: 'sidebar'
    }
  });

  const {
    setNodeRef: setDroppableRef,
    isOver,
    active
  } = useDroppable({
    id: row._id,
    data: {
      accepts: ['technician'],
      row
    }
  });

  React.useEffect(() => {
    const rect = rowRef?.current.getBoundingClientRect();
    setSize(index, isMobile ? 300 : rect?.height);
  }, [setSize, index, isMobile]);

  const columns = useMemo(() => {
    return [
      {
        id: 'resourceNumber',
        head: selectedType === 'fieldTicket' ? 'Field Ticket' : selectedType === 'fieldServiceOrder' ? 'Field Service Order' : 'Rental Job',
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
        id: 'serviceName',
        head: 'Service Name',
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
      ref={(div) => {
        setDroppableRef(div);
        rowRef.current = div;
      }}
      className={cn(isMobile ? 'w-[300px] px-1' : 'px-4 pb-3', isDragging ? (isMobile ? 'hidden' : '!w-0 overflow-hidden p-0') : '')}
    >
      <div
        {...attributes}
        {...listeners}
        ref={(div) => {
          setNodeRef(div);
        }}
        style={{ ...styleDnd }}
        className={cn(isMobile ? '' : 'w-[262px]')}
      >
        <div
          className={cn(
            'cursor-grab space-y-2 rounded-md border  p-3 shadow-lg',
            isOver && active.data.current?.type === 'technician' ? 'bg-gray-300 dark:bg-gray-800' : 'bg-[--dark-secondary,white]',
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
