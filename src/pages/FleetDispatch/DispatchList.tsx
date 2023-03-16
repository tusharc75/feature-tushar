import { useState, useCallback, useEffect, useRef } from 'react';
import { Box } from '@material-ui/core';
import { useDrop } from 'react-dnd';
import update from 'immutability-helper';
import DispatchCard from './DispatchCard';

const DispatchList = ({ activity, cardType, handleDispatch }) => {

    const ref = useRef(null);
    const [list, setList] = useState([]);

    useEffect(() => {
        setList(activity);
    }, [activity, cardType]);

    const moveCard = useCallback(
        (dragIndex, hoverIndex) => {
            const dragCard = setList[dragIndex];
            setList(
                update(list, {
                    $splice: [
                        [dragIndex, 1],
                        [hoverIndex, 0, dragCard]
                    ]
                })
            );
        },
        [list]
    );

    const [{ }, drop] = useDrop({
        accept: 'move',
        drop: (data: any) => {
        }
    });
    drop(ref);

    return (
        <div ref={ref}>
            {list?.map((element, index) => (
                <DispatchCard
                    data={element}
                    key={element?.id}
                    id={element?.id}
                    index={index}
                    moveCard={moveCard}
                    cardType={cardType}
                    handleDispatch={handleDispatch}
                />
            ))}
        </div>
    );
};

export default DispatchList;
