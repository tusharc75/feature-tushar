import { arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconButton, Menu, MenuItem, TextField } from '@material-ui/core';
import { InfoOutlined, MoreHoriz, Opacity } from '@material-ui/icons';
import React, { useContext } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { checkFieldDependency } from 'src/constants/formulaUtility';
import FieldList from '../FieldList';
import { Properties } from '../Properties';
import update from 'immutability-helper';
import { useDndMonitor } from '@dnd-kit/core';
import { addItemAtIndex, removeItemAtIndex } from 'src/constants/helpers';

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

  const { setNodeRef, attributes, listeners, transform, transition, over, active, isDragging } = useSortable({
    id: data._id,
    transition: {
      duration: 150, // milliseconds
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    },
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

  return (
    <>
      {isPreviewVisible && <div className="min-h-[80px] [border:1px_dashed_var(--common-border-color)] p-2 ">Drop</div>}
      <div
        style={style}
        {...attributes}
        {...listeners}
        ref={setNodeRef}
        className={`${
          isDragging
            ? '[border:1px_dashed_var(--common-border-color)] bg-[var(--dark-secondary,theme("colors.cyan.100"))]'
            : 'border border-[var(--common-border-color)] bg-[var(--dark-primary,white)]'
        }  p-2`}
      >
        <div className={isDragging ? ' opacity-50' : ''}>
          <div className="grid grid-cols-[1fr_25px] items-center justify-between gap-2">
            <div className="grid grid-cols-[1fr_1fr] items-center gap-2">
              <div className="">
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
                  <p className="MuiTypography-body2 min-h-[38px]">{data.fieldLabel}</p>
                )}
              </div>
              <p className="text-gray-500 dark:text-slate-300">{FieldList[data?.type?.toUpperCase()]?.label}</p>
            </div>
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
          </div>
        </div>
        <div className=" text-right mr-[2px]">
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
    </>
  );
};

export default Field;
