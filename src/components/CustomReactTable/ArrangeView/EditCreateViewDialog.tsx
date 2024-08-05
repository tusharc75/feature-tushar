import {
  Checkbox,
  CircularProgress,
  Dialog,
  FormControl,
  FormControlLabel,
  FormLabel,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  useMediaQuery
} from '@material-ui/core';
import React, { useContext, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { GridViewSavedData } from 'src/components/CustomReactTable/ArrangeView/ArrangeViewMenu';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import { object, string } from 'yup';
import { Formik, FormikErrors } from 'formik';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { getStickyColumnNames } from 'src/components/CustomReactTable/utils';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useDndSensors } from 'src/hooks';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import update from 'immutability-helper';
import { DragHandle } from '@material-ui/icons';
import { startCase } from 'lodash';
import { CSS } from '@dnd-kit/utilities';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';

type EditCreateViewDialogProps = {
  onClose: () => void;
  data: GridViewSavedData | null;
  getAllSavedViews: () => void;
  renderedFrom: string;
  columns: any[];
  hideSelection: boolean;
  expander: boolean;
};

const formSchema = object().shape({
  name: string().min(2, 'Name too short').max(50, 'Name too long!').required('Name is required')
});

const initialValue = {
  name: '',
  access: 'everyone',
  default: false,
  order: [],
  hide: []
};

export type FormSchema = {
  name: string;
  access: string;
  default: boolean;
  order: string[];
  hide: string[];
};

type SetFieldValue = (field: string, value: any, shouldValidate?: boolean) => Promise<void | FormikErrors<FormSchema>>;

const EditCreateViewDialog = ({ onClose, data, getAllSavedViews, renderedFrom, columns, hideSelection, expander }: EditCreateViewDialogProps) => {
  const { stickyColumns } = useMemo(() => getStickyColumnNames({ allColumn: columns, expander, hideSelection }), [columns, expander, hideSelection]);

  const columnsWithoutSticky = useMemo(() => columns.filter((c) => !stickyColumns.includes(c.id || c.accessor)), [stickyColumns, columns]);
  const sensors = useDndSensors();
  const toastConfig = useContext(CustomToastContext);

  const [sortedColumns, setSortedColumns] = useState(
    data?.order ? columnsWithoutSticky.sort((a, b) => data.order?.indexOf(a.id) - data.order?.indexOf(b.id)) : columnsWithoutSticky
  );
  const [stateVisibleColumns, setStateVisibleColumns] = useState(() => {
    const temp = {};
    if (data?.hide?.length > 0) {
      for (const col of columnsWithoutSticky) {
        temp[col.id] = !data.hide?.includes(col.id);
      }
    } else {
      for (const col of columnsWithoutSticky) {
        temp[col.id] = true;
      }
    }
    return temp;
  });
  const [isMinimized, setMinimized] = useState(true);
  const [activeItem, setActiveItem] = useState<any>(null);
  const isMobileView = useMediaQuery('(max-width:768px)');
  const [defaultValue] = useState(
    data ? { name: data.name, access: data.access, default: data.default, order: data.order, hide: data.hide } : initialValue
  );

  const [loading, setLoading] = useState(false);

  const updateArrangeView = async (values: FormSchema) => {
    setLoading(true);
    try {
      const payload = { ...values, key: renderedFrom, _id: data._id };
      await axiosInstance().put('/user/grid-view', payload);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'View updated'
      });
      getAllSavedViews();
      onClose();
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  const saveArrangeView = async (values: FormSchema) => {
    setLoading(true);
    try {
      const payload = { ...values, key: renderedFrom };
      await axiosInstance().post('/user/grid-view', payload);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'View created'
      });
      getAllSavedViews();
      onClose();
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (column: any, e: React.ChangeEvent<HTMLInputElement>, setFieldValue: SetFieldValue) => {
    const { checked } = e.target;
    const { id } = column;
    const visibleColumnState = { ...stateVisibleColumns, [id]: checked };
    setStateVisibleColumns(visibleColumnState);
    setFieldValue(
      'hide',
      Object.entries(visibleColumnState)
        .filter(([, visible]) => !visible)
        .map(([columnId]) => columnId)
    );
  };

  const handleReset = (setFieldValue: SetFieldValue) => {
    const visibleColumns = {};
    columnsWithoutSticky.forEach((col) => {
      visibleColumns[col.id] = true;
    });
    setSortedColumns(columnsWithoutSticky);
    setStateVisibleColumns(visibleColumns);
    setFieldValue('order', []);
    setFieldValue('hide', []);
  };

  // DND
  const onDragStart = (event: DragStartEvent) => {
    if (!event) return;
    setActiveItem(event?.active?.data.current?.props);
  };

  const moveItem = (event: DragEndEvent, setFieldValue: SetFieldValue) => {
    setActiveItem(null);
    if (!event.over || event.active.id === event.over.id) return;
    const { active, over } = event;
    const dragIndex = active.data.current.index;
    const dropIndex = over.data.current.index;

    const dragCard = sortedColumns[dragIndex];
    const hoverCard = sortedColumns[dropIndex];

    if (dragCard?.accessor === 'action' || dragCard?.accessor === 'selection' || dragCard?.lockPosition) return;
    if (hoverCard?.accessor === 'action' || hoverCard?.accessor === 'selection' || hoverCard?.lockPosition) return;

    const columnsForGrid = update(sortedColumns, {
      $splice: [
        [dragIndex, 1],
        [dropIndex, 0, dragCard]
      ]
    });
    setSortedColumns([...columnsForGrid]);
    setFieldValue(
      'order',
      columnsForGrid.map((c) => c.id)
    );
  };

  const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>, setFieldValue: SetFieldValue) => {
    const visibleColumns = {};
    columnsWithoutSticky?.forEach((c: any) => {
      if (c.disabled) {
        visibleColumns[c.id] = true;
      } else {
        visibleColumns[c.id] = event.target.checked;
      }
    });
    setStateVisibleColumns(visibleColumns);
    setFieldValue(
      'hide',
      Object.entries(visibleColumns)
        .filter(([, visible]) => !visible)
        .map(([columnId]) => columnId)
    );
  };

  const isAllChecked = () => {
    return columnsWithoutSticky?.every((c: any) => {
      if (c.disabled) {
        return true;
      }
      return stateVisibleColumns[c.id];
    });
  };

  return (
    <Formik
      initialValues={defaultValue ? defaultValue : initialValue}
      validationSchema={formSchema}
      validateOnMount
      onSubmit={(formData) => {
        if (data) {
          updateArrangeView(formData);
        } else {
          saveArrangeView(formData);
        }
      }}
    >
      {({ submitForm, values, errors, touched, setFieldValue, dirty }) => (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={!isMinimized || (isMobile && !isTablet) || isMobileView}>
          <CustomDialogHeader
            title={data ? 'Edit Arrange View' : 'Create Arrange View'}
            onClose={onClose}
            showRequiredLabel={true}
            showManimizeMaximize={isMobileView ? false : true}
            isMinimized={isMinimized}
            onMinimizeMaximize={() => setMinimized((prevState) => !prevState)}
          />
          <CustomDialogContent>
            <div className="my-2">
              <div className="form grid gap-2 rounded-md p-3 shadow-md [border:1px_solid_var(--common-border-color)] ">
                <div>
                  <TextField
                    fullWidth
                    value={values['name']}
                    onChange={(e) => {
                      setFieldValue('name', e.target.value.trimStart());
                    }}
                    id="view-name"
                    name="name"
                    label="Name"
                    variant="outlined"
                    size="small"
                    required
                    error={touched['name'] && Boolean(errors['name'])}
                    helperText={touched['name'] && errors['name']}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <FormControl size="small">
                    <FormLabel id="view-access-radio-button">Access</FormLabel>
                    <RadioGroup
                      row
                      aria-labelledby="view-access-radio-button"
                      value={values['access']}
                      onChange={(e) => {
                        setFieldValue('access', e.target.value.trimStart());
                      }}
                      name="access"
                    >
                      <FormControlLabel value="everyone" control={<Radio size="small" />} label="Everyone" />
                      <FormControlLabel value="private" control={<Radio size="small" />} label="Private" />
                    </RadioGroup>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={values['default']}
                        onChange={(e) => {
                          setFieldValue('default', e.target.checked);
                        }}
                        name="default"
                      />
                    }
                    label="Set as Default"
                  />
                </div>
              </div>
              <div className="h-[1px] py-3 [border-bottom:1px_solid_var(--common-border-color)]" />
              <div className="my-3 list-none px-[20px] ">
                <div className="flex justify-between gap-2">
                  <p className="flex-grow text-sm font-normal">Toggle and Drag & Drop to arrange</p>
                  <span className="mr-[16px] flex-shrink-0">
                    <Switch size="small" checked={isAllChecked()} onChange={(e) => handleToggleAll(e, setFieldValue)} />
                  </span>
                </div>
              </div>

              {/* <h3 className="px-4 py-2 text-[0.86rem] font-medium text-black/50 dark:text-white/70">Toggle and Drag & Drop to arrange</h3> */}

              <div
                className={cn(
                  ' overflow-auto rounded-md px-3 shadow-md [border:1px_solid_var(--common-border-color)]',
                  !isMinimized || (isMobile && !isTablet) || isMobileView ? 'max-h-[270px] md:max-h-[500px]' : 'max-h-[350px]'
                )}
              >
                <DndContext
                  onDragEnd={(e) => moveItem(e, setFieldValue)}
                  modifiers={[restrictToVerticalAxis]}
                  onDragStart={onDragStart}
                  sensors={sensors}
                >
                  <SortableContext items={sortedColumns.map((c) => c.accessor)}>
                    <ul className="list-none">
                      {sortedColumns.map((column, index) => (
                        <RenderListItem
                          key={column.accessor}
                          checked={stateVisibleColumns[column.id]}
                          column={column}
                          index={index}
                          handleToggle={handleToggle}
                          setFieldValue={setFieldValue}
                          values={values}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                  <DragOverlay>
                    {activeItem && (
                      <span className="[&_.MuiListItemIcon-root]:!cursor-grabbing">
                        <RenderListItem {...activeItem} />
                      </span>
                    )}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton onClick={() => handleReset(setFieldValue)} iconForMobile={false} disabled={loading}>
              Reset
            </ThemeButton>
            <ThemeButton type="submit" onClick={submitForm} iconForMobile={false} borderColor="none" color="primary" disabled={loading || !dirty}>
              Save <CircularProgress size={20} color="inherit" className={`${loading ? '' : 'sr-only'} ml-2`} />
            </ThemeButton>
          </CustomDialogFooter>
        </Dialog>
      )}
    </Formik>
  );
};

export default EditCreateViewDialog;

interface ItemProps {
  column: any;
  handleToggle: any;
  checked: boolean;
  index: number;
  values: FormSchema;
  setFieldValue: any;
}

const RenderListItem = ({ column, handleToggle, checked, index, values, setFieldValue }: ItemProps) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.accessor,
    data: {
      type: 'Column',
      index,
      props: { column, handleToggle, checked, index, values, setFieldValue }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return ['left', 'right']?.includes(column?.sticky) || ['selection', 'expander'].includes(column.accessor) ? (
    <div className="d-none"></div>
  ) : (
    <li
      ref={setNodeRef}
      style={style}
      className={`${
        isDragging ? ' bg-[var(--dark-secondary,theme("colors.blue.200"))] ' : 'bg-[var(--dark-secondary,#fff)]'
      } list-none transition-colors`}
    >
      <div
        className={`flex items-center p-[8px_17px_8px_0] [border-bottom:1px_solid_var(--common-border-color)] ${
          index === 0 ? '[border-top:1px_solid_var(--common-border-color)]' : ''
        } `}
      >
        <ListItemIcon className={` cursor-grab pl-2 ${isDragging ? ' cursor-grabbing' : ''}`} {...attributes} {...listeners}>
          <DragHandle />
        </ListItemIcon>
        <ListItemText id={column.accessor} primary={column.header || startCase(column?.accessor)} className=" select-none" />
        <Switch
          size="small"
          disabled={column.disabled}
          checked={checked}
          onChange={(e) => {
            handleToggle(column, e, setFieldValue);
          }}
        />
      </div>
    </li>
  );
};
