import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconButton, Menu, MenuItem, TextField } from '@mui/material';
import { DragIndicator, InfoOutlined, MoreHoriz } from '@material-ui/icons';
import React, { useContext } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { checkFieldDependency } from 'src/constants/formulaUtility';
import FieldList from '../FieldList';
import { Properties } from '../Properties';
import { colSpans } from 'src/constants/helpers';

type ItemPorps = {
  section: any;
  setSections: (data: any[]) => void;
  addSection: (index?: number) => void;
  index: number;
  sections: any[];
  onAddRemoveField: any;
  addDeleteField: any;
  module: any;
  extraFields: any;
  isCalculativeField: any;
  brandId: any;
  sectionId: number | string;
  data: any;
};

const Field = ({
  section,
  addSection,
  index,
  setSections,
  sections,
  onAddRemoveField,
  addDeleteField,
  module,
  extraFields,
  isCalculativeField,
  brandId,
  data,
  sectionId
}: ItemPorps) => {
  const toastConfig = useContext(CustomToastContext);

  const onChangeFieldName = (fieldId, value) => {
    let data = [...sections];
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele._id.toString() === fieldId.toString()) {
            ele.fieldLabel = value;
          }
        });
      }
    });
    setSections(data);
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [propertie_open, setPropertieOpen] = React.useState(false);
  const [field_data, setFieldData] = React.useState();

  const handleClickOpenPropertie = (data) => {
    setPropertieOpen(true);
    setFieldData(data);
    handleClose();
  };
  const handleClosePropertie = () => {
    setPropertieOpen(false);
  };

  const deleteField = (fieldId) => {
    if (onAddRemoveField) onAddRemoveField();
    let data = [...sections];
    var result = checkFieldDependency(fieldId, sectionId, data);
    if (result.error) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: result.message });
      handleClose();
      return;
    }
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field = row.field.filter((i) => i._id.toString() !== fieldId.toString());
      }
    });
    setSections(data);
    addDeleteField(fieldId);
    handleClose();
  };

  const handleClone = (fieldData) => {
    let data = [...sections];
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.splice(index + 1, 0, {
          ...fieldData,
          editAble: true,
          deletAble: true,
          _id: parseInt((Math.random() * 100000).toString()),
          fieldLabel: fieldData.type,
          fieldName: fieldData.type
        });
      }
    });
    setSections(data);
    handleClose();
  };

  const { setNodeRef, attributes, listeners, transform, transition, isDragging, active, over } = useSortable({
    id: data._id,
    data: {
      type: 'Field',
      index: index,
      data,
      sectionId,
      props: {
        section,
        addSection,
        index,
        setSections,
        sections,
        onAddRemoveField,
        addDeleteField,
        module,
        extraFields,
        isCalculativeField,
        brandId,
        data,
        sectionId
      }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  const isPreviewVisible =
    active?.data.current?.type !== 'NewSection' && active?.data.current.sectionId !== sectionId && over && over.id === data._id;

  if (isPreviewVisible) {
    return (
      <div
        style={style}
        ref={setNodeRef}
        className={`${colSpans[data.columnSize - 1] || 'col-span-6'} ${
          isPreviewVisible
            ? 'bg-[var(--dark-secondary,theme("colors.blue.200"))]'
            : 'border border-[var(--common-border-color)] bg-[white] dark:bg-[hsla(240,27%,14%,100%)]'
        }  flex min-h-[56.5px] items-center justify-center p-2 text-center`}
      >
        <h6 className="text-center text-2xl font-bold text-gray-400 dark:text-gray-600">Drop {active.data.current.label}</h6>
      </div>
    );
  }

  return (
    <>
      <div
        style={style}
        ref={setNodeRef}
        className={`${colSpans[data.columnSize - 1] || 'col-span-6'} ${
          isDragging || isPreviewVisible
            ? 'bg-[var(--dark-secondary,theme("colors.blue.200"))]'
            : 'border border-[var(--common-border-color)] bg-[white] dark:bg-[hsla(240,27%,14%,100%)]'
        }  flex min-h-[56.5px] items-center p-2`}
      >
        <div className={`${isDragging ? ' opacity-50' : ''} flex-grow`}>
          <div className="grid grid-cols-[1fr_28px] items-center justify-between gap-2 lg:grid-cols-[1fr_50px]">
            <div className="grid items-center gap-2 lg:grid-cols-[1.2fr_1fr]">
              <div className="flex items-center gap-2">
                <IconButton size="small" {...attributes} {...listeners} className="drag-handle !cursor-grab">
                  <DragIndicator fontSize="small" />
                </IconButton>
                {data.editAble ? (
                  <TextField
                    id={data._id}
                    variant="outlined"
                    margin="none"
                    size="small"
                    fullWidth
                    value={data.fieldLabel}
                    onChange={(event) => onChangeFieldName(data._id, event.target.value)}
                  />
                ) : (
                  <p className="MuiTypography-body2 line-clamp-1">{data.fieldLabel}</p>
                )}
              </div>
              <p className="ml-[40px] line-clamp-1 min-w-0 text-gray-500 dark:text-slate-300 lg:ml-0">
                {FieldList[data?.type?.toUpperCase()]?.label}
              </p>
            </div>
            <div className="ml-auto flex flex-col items-center lg:flex-row">
              <HtmlTooltip title={`Field Name - ${data?.fieldName}`}>
                <InfoOutlined
                  fontSize="small"
                  color="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(data?.fieldName);
                  }}
                  className="cursor-pointer"
                />
              </HtmlTooltip>
              <div className=" mr-[2px] text-right">
                <IconButton aria-label="setting" onClick={handleClick} size={'small'}>
                  <MoreHoriz fontSize="small" />
                </IconButton>
                <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                  <MenuItem onClick={() => handleClickOpenPropertie(data)}>Edit Properties</MenuItem>
                  <MenuItem onClick={() => handleClone(data)}>Clone</MenuItem>
                  {((['product-template', 'price-template'].includes(module) && data.editAble) ||
                    ['form-builder-master'].includes(module) ||
                    data.deletAble ||
                    true) && <MenuItem onClick={() => deleteField(data._id)}>Delete</MenuItem>}
                </Menu>
                {propertie_open ? (
                  <Properties
                    handleClose={handleClosePropertie}
                    fieldData={field_data}
                    sectionId={sectionId}
                    section={sections}
                    setSection={setSections}
                    module={module}
                    extraFields={extraFields}
                    isCalculativeField={isCalculativeField}
                    brandId={brandId}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Field;
