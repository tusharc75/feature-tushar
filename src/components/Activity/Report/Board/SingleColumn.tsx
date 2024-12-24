import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button, IconButton, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ActivityModelHandler from '../../ActivityModelHandler';
import { Column } from './type';

import { useData } from '../../../../StateProvider/Provider';
import SingleCard from './SingleCard';
import { useDroppable } from '@dnd-kit/core';
import { ThemeButton } from 'src/components/Helpers/Buttons';

type SingleColumnProps = {
  column: Column;
  loading: boolean;
  type: any;
  setSelectedStatus: any;
  setOpenDialog: any;
  setFullScreen: any;
  fetchBoard: any;
};

const SingleColumn = ({ column, loading, type, setSelectedStatus, setOpenDialog, setFullScreen, fetchBoard }: SingleColumnProps) => {
  const {
    state: { permissions }
  } = useData();

  const [selectedId, setSelectedId] = useState(null);

  const { setNodeRef, active } = useDroppable({
    id: column.status,
    data: {
      type: 'Column',
      column: column.status
    }
  });

  return (
    <>
      <div className={`group rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)]`} key={column.status} ref={setNodeRef}>
        {!loading && (
          <div className="sticky top-0 z-10 rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)] px-[13px] py-[14px]">
            <Typography variant="subtitle2" style={{ width: '50%', fontSize: '0.95rem', fontWeight: 700 }} className=" capitalize">
              {column.status}
              {' (' + column.items.length + ')'}
            </Typography>
            {permissions && permissions[type?.toLowerCase()]?.isCreate ? (
              <HtmlTooltip title={`Create ${type}`}>
                <IconButton
                  size="small"
                  style={{ float: 'right', marginTop: '-25px' }}
                  onClick={() => {
                    setSelectedStatus(column.status);
                    setOpenDialog(true);
                    setFullScreen(false);
                  }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            ) : null}
          </div>
        )}
        <ul
          className={`body min-h-[calc(100%-120px)] p-2 ${
            active?.data.current.column === column.status ? 'bg-blue-200 dark:bg-gray-900' : ''
          } transition-colors`}
        >
          <SortableContext items={column.items.map((d) => d._id)} strategy={verticalListSortingStrategy}>
            {column.items.map((element, index) => (
              <SingleCard
                data={element}
                key={element?._id}
                index={index}
                type={type}
                canUpdate={permissions[type?.toLowerCase()]?.isUpdate}
                canDelete={permissions[type?.toLowerCase()]?.isDelete}
                fetchBoard={fetchBoard}
                setSelectedId={setSelectedId}
              />
            ))}
          </SortableContext>
        </ul>
        {permissions && permissions[type?.toLowerCase()]?.isCreate && !loading ? (
          <div className=" sticky bottom-0 opacity-0 group-hover:opacity-100">
            <ThemeButton
              iconForMobile={false}
              fullWidth
              startIcon={<Add />}
              onClick={() => {
                setOpenDialog(true);
                setFullScreen(false);
              }}
            >
              Create {type}
            </ThemeButton>
          </div>
        ) : null}
      </div>
      {selectedId && <ActivityModelHandler setActivityData={setSelectedId} activityType={type} fetchBoard={fetchBoard} activityId={selectedId} />}
    </>
  );
};

export default SingleColumn;
