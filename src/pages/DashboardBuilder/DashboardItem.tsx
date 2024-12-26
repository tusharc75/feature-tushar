import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton, ThemeOptions, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Delete } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import RenderIcon from './RenderIcon';
import { IFormDataType } from './builderHelpers';
import { colSpans } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
  formData: IFormDataType;
  index?: number;
  selectedData?: IFormDataType | null;
  handleEdit?: (data: IFormDataType) => void;
  handleRemove?: (id: string) => void;
}

const DashboardItem = ({ id, formData, handleEdit, handleRemove, selectedData, index }: DashboardProps) => {
  const classes = useClasses();

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: formData.uniqueId,
    data: {
      type: 'formData',
      index
    }
  });

  const isEditing = Boolean(selectedData) && selectedData?.uniqueId === id;
  const CHART_TYPE = formData.chartType || formData.graphType;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <li ref={setNodeRef} {...attributes} {...listeners} className={`${colSpans[formData.column - 1]}  list-none`} style={style}>
      <Box
        className={`${classes.paper} [border:1px_solid_var(--common-border-color)] ${
          isEditing || isDragging ? 'bg-[var(--dark-primary,theme("colors.blue.200"))]' : 'bg-[var(--dark-secondary,_white)]'
        }`}
      >
        <Box>
          <Typography className={classes.title}>{formData.chartTitle}</Typography>
          <p>
            col = {formData.column} ({CHART_TYPE})
          </p>

          <Box mt={2} display="flex" flexDirection="column" alignItems="center">
            <RenderIcon type={CHART_TYPE} style={{ color: 'var(--new-theme-secondary-color)' }} className={classes.chartIcon} />
            {isEditing && <Typography className={classes.title}>Editing...</Typography>}
          </Box>
        </Box>

        {!isEditing && (
          <Box display={'flex'} justifyContent="space-between">
            <ThemeButton iconForMobile={<EditIcon />} variant={'outlined'} onClick={() => handleEdit(formData)} tooltip={'Edit'}>
              {'Edit'}
            </ThemeButton>
            <IconButton size="small" onClick={() => handleRemove(id)}>
              <Delete color="error" />
            </IconButton>
          </Box>
        )}
      </Box>
    </li>
  );
};

export default DashboardItem;
