import { useState, useCallback, useRef, useContext } from "react";
import {
  Button,
  Dialog,
  ListItem,
  List,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@material-ui/core";
import { DragIndicator } from "@material-ui/icons";
import { isMobile, isTablet } from "react-device-detect";
import { useDrag, useDrop, DropTargetMonitor } from "react-dnd";
import { XYCoord } from "dnd-core";
import update from "immutability-helper";

import CustomDialogHeader from "../../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../../components/CustomDialog/CustomDialogFooter";
import { CustomDialogTransition } from "../../../../constants/helpers";
import { CustomToastContext } from "../../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../../axios/axiosInstance";

const ItemTypes = {
  CARD: "card",
};

const ColumnsDialog = (props) => {
  const { columns, setOpenDialog, versionStatus, selectedTNC, id, version, refresh } = props;
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [cards, setCards] = useState(
    columns.map((col, idx) => ({ id: idx + 1, text: col })) || []
  );
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  
  const [{ handlerId }, drop] = useDrop({
    accept: "Card",
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
  });

  const moveCard = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = cards[dragIndex];
      setCards(
        update(cards, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard],
          ],
        })
      );
    },
    [cards]
  );

  const closeDialog = () => {
    setOpenDialog(false);
  };

  const onSave = () => {
    setSubmitting(true);
    axiosInstance()
      .post(`quote-builder/updateVersion/${id}?version=${version}`, {
        acceptedColumns: cards.map((card) => card.text),
        status: versionStatus,
        TNC: selectedTNC
      })
      .then(({ data }) => {
        setSubmitting(false);
        closeDialog();
        refresh(version);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || (isMobile || isTablet)}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={closeDialog}
    >
      <CustomDialogHeader
        title="Re-arrange sequence for columns"
        onClose={closeDialog}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen(prevState => !prevState)
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
        <List component="nav" aria-label="main mailbox folders">
          {cards.map(({ text, id }, index) => (
            <Card
              key={id}
              index={index}
              id={id}
              text={text}
              moveCard={moveCard}
            />
          ))}
        </List>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          disabled={isSubmitting}
          color="primary"
          variant="outlined"
          size="small"
          onClick={closeDialog}
        >
          Cancel
        </Button>
        <Button
          disabled={isSubmitting}
          color="primary"
          variant="contained"
          size="small"
          onClick={onSave}
        >
          {isSubmitting ? <CircularProgress size={18} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ColumnsDialog;

//  Another component

interface CardProps {
  id: any;
  text: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const Card = ({ index, id, text, moveCard }: CardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;

  drag(drop(ref));
  return (
    <div ref={ref} data-handler-id={handlerId}>
      <ListItem key={id}>
        <ListItemIcon>
          <DragIndicator />
        </ListItemIcon>
        <ListItemText primary={text} />
      </ListItem>
    </div>
  );
};
