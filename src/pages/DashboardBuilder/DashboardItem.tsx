import { Draggable } from '@hello-pangea/dnd';
import { Box, Grid, IconButton, ThemeOptions, Typography, makeStyles } from '@material-ui/core';
import { Delete, Edit } from '@material-ui/icons';
import RenderIcon from './RenderIcon';
import { IFormDataType } from './builderHelpers';

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
    borderRadius: '8px',

    '&:hover': {
      icons: {
        display: 'block'
      }
    }
  },
  title: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--dark-primary-text,#555)'
  },
  chartIcon: {
    fontSize: '120px'
  }
}));

interface DashboardProps {
  id: string;
  index: number;
  formData: IFormDataType;
  selectedData?: IFormDataType | null;
  handleEdit: (data: IFormDataType) => void;
  handleRemove: (id: string) => void;
}

const DashboardItem = ({ id, formData, handleEdit, handleRemove, selectedData, index }: DashboardProps) => {
  const classes = useClasses();

  const isEditing = selectedData?.uniqueId === id;
  const CHART_TYPE = formData.chartType || formData.graphType;

  return (
    <Draggable key={id} draggableId={`${id}`} index={index}>
      {(provided, snapshot) => (
        <li {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
          <Grid item xs={formData.column}>
            <Box
              className={`${classes.paper} ${
                snapshot.isDragging ? ' [border:1px_dashed_var(--common-border-color)]' : '[border:1px_solid_var(--common-border-color)]'
              }`}
              style={{
                backgroundColor: isEditing ? 'var(--dark-primary,#dedede)' : 'var(--dark-secondary, white)'
              }}
            >
              <Box>
                <Typography className={classes.title}>{formData.chartTitle}</Typography>
                <p>
                  col = {formData.column} ({CHART_TYPE})
                </p>

                <Box mt={2} display="flex" flexDirection="column" alignItems="center">
                  <RenderIcon type={CHART_TYPE} style={{ color: 'var(--new_theme_secondary_color)' }} className={classes.chartIcon} />
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
            </Box>
          </Grid>
        </li>
      )}
    </Draggable>
  );
};

export default DashboardItem;
