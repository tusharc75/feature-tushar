import { useState, useCallback, useEffect, useRef } from 'react';
import { Box, } from '@material-ui/core';
import { useDrop } from 'react-dnd';
import update from 'immutability-helper';
import { BoardBox } from './BoardBox';
import { useData } from '../../../../StateProvider/Provider';
import ActivityModelHandler from '../../ActivityModelHandler';

export const BoardList = ({ status, type, activity, selectedResource, resource, fetchBoard, handleChangeStatus, loading }) => {
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();
  const ref = useRef(null);
  const [subActivity, setSubActivity] = useState([]);
  const [isCreateButton, setCreateButton] = useState(false);

  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setSubActivity(activity);
  }, [activity]);

  const moveCard = useCallback(
    (dragIndex, hoverIndex) => {
      const dragCard = subActivity[dragIndex];
      setSubActivity(
        update(subActivity, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard]
          ]
        })
      );
    },
    [subActivity]
  );

  const [{}, drop] = useDrop({
    accept: 'move',
    drop: (data: any) => {
      handleChangeStatus(data.id, status, data.index);
    }
  });

  drop(ref);

  const handleActivityOpen = (id) => {
    setSelectedId(id);
  };

  return (
    <div ref={ref} style={{ height: 'calc(100% - 42px)' }}>
      <Box minHeight="100%" onMouseEnter={() => setCreateButton(true)} onMouseLeave={() => setCreateButton(false)}>
        {!loading ? (
          <>
            {subActivity.map((element, index) => (
              <BoardBox
                data={element}
                key={element?._id}
                id={element?._id}
                index={index}
                type={type}
                canUpdate={permissions[type?.toLowerCase()]?.isUpdate}
                canDelete={permissions[type?.toLowerCase()]?.isDelete}
                moveCard={moveCard}
                fetchBoard={fetchBoard}
                handleActivityOpen={handleActivityOpen}
              />
            ))}
          </>
        ) : (
          <Box p={1}></Box>
        )}
      </Box>

      {selectedId && <ActivityModelHandler setActivityData={setSelectedId} activityType={type} fetchBoard={fetchBoard} activityId={selectedId} />}
    </div>
  );
};
