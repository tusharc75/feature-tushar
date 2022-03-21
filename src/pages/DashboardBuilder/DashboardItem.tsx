import { Grid, Paper, Box, IconButton, makeStyles, ThemeOptions, Typography, Button } from '@material-ui/core';
import { Edit, Delete } from '@material-ui/icons';
import { useDrop, useDrag } from 'react-dnd';
import { IFormDataType } from './builderHelpers';
import RenderIcon from './RenderIcon';

const useClasses = makeStyles((theme: ThemeOptions) => ({
  paper: {
    padding: '16px',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    width: '100%',
    minHeight: '250px',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
    position: 'relative',

    '&:hover': {
      icons: {
        display: 'block'
      }
    }
  },
  title: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#555'
  },
  chartIcon: {
    fontSize: '120px'
  }
}));

interface DashboardProps {
  id: string;
  formData: IFormDataType;
  selectedData?: IFormDataType | null;
  findCard: (id: string) => { card: IFormDataType; index: number };
  moveCard: (id: string, index: number) => void;
  itemTypes: { CARD: string };
  handleEdit: (data: IFormDataType) => void;
  handleRemove: (id: string) => void;
}

interface Item {
  id: string;
  originalIndex: number;
}

const DashboardItem = ({ id, formData, findCard, moveCard, itemTypes, handleEdit, handleRemove, selectedData }: DashboardProps) => {
  const classes = useClasses();
  const originalIndex = findCard(formData.uniqueId).index;
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: itemTypes.CARD,
      item: { id, originalIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      }),
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item;
        const didDrop = monitor.didDrop();
        if (!didDrop) {
          moveCard(droppedId, originalIndex);
        }
      }
    }),
    [id, originalIndex, moveCard]
  );

  const [, drop] = useDrop(
    () => ({
      accept: itemTypes.CARD,
      hover({ id: draggedId }: Item) {
        if (draggedId !== id) {
          const { index: overIndex } = findCard(id);
          moveCard(draggedId, overIndex);
        }
      }
    }),
    [findCard, moveCard]
  );

  const opacity = isDragging ? 0.8 : 1;
  const isEditing = selectedData?.uniqueId === id;
  const CHART_TYPE = formData.chartType || formData.graphType;

  return (
    <Grid ref={(node) => drag(drop(node))} item xs={formData.column}>
      <Paper className={classes.paper} style={{ backgroundColor: isEditing ? '#dedede' : 'white' }}>
        <Box style={{ opacity }}>
          <Typography className={classes.title}>{formData.chartTitle}</Typography>
          <p>
            col = {formData.column} ({CHART_TYPE})
          </p>

          <Box mt={2}>
            <RenderIcon type={CHART_TYPE} color="secondary" className={classes.chartIcon} />
            {isEditing && <Typography className={classes.title}>Editing...</Typography>}
          </Box>
        </Box>

        {!isEditing && (
          <Box display={'flex'} justifyContent="space-between">
            <IconButton size="small" onClick={() => handleEdit(formData)}>
              <Edit color="primary" />
            </IconButton>
            <IconButton size="small" onClick={() => handleRemove(id)}>
              <Delete color="error" />
            </IconButton>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

export default DashboardItem;
