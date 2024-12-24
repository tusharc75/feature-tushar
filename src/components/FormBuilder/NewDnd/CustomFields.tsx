import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Divider, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreHoriz } from '@mui/icons-material';
import { useCallback, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { AddField } from '../AddField';

const CustomFields = () => {
  const [fields, setFields] = useState([]);
  const [isAddField, setIsAddField] = useState(false);
  const [fieldData, setFieldData] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  const fetchCustomField = useCallback(() => {
    axiosInstance()
      .get(`/sa-formbuilder/custom-field`)
      .then(({ data: { data } }) => {
        setFields(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [toastConfig]);

  useEffect(() => {
    fetchCustomField();
  }, [fetchCustomField]);

  const handleOpenAddField = () => {
    setIsAddField(true);
    setFieldData(null);
  };

  const handleAddField = (values) => {
    if (values._id && !Number.isInteger(values._id)) {
      axiosInstance()
        .put(`/sa-formbuilder/custom-field`, values)
        .then(({ data: { data } }) => {
          setIsAddField(false);
          setFieldData(null);
          fetchCustomField();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`/sa-formbuilder/custom-field`, values)
        .then(({ data: { data } }) => {
          setIsAddField(false);
          setFieldData(null);
          fetchCustomField();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleCloseAddField = () => {
    setIsAddField(false);
  };

  const handleDelete = (id) => {
    axiosInstance()
      .delete(`/sa-formbuilder/custom-field/` + id)
      .then(() => {
        fetchCustomField();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleEdit = (data) => {
    setFieldData(data);
    setIsAddField(true);
  };

  const handleImportFields = (e) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data: any = e.target.result;
      data = JSON.parse(data);
      delete data._id;
      handleAddField(data);
    };
    reader.readAsBinaryString(f);
  };

  return (
    <>
      <div className=" col-span-2">
        <Divider />
      </div>
      <div className="col-span-2">
        <ThemeButton iconForMobile={false} fullWidth onClick={handleOpenAddField}>
          Add Custom Field
        </ThemeButton>
      </div>
      <div className="col-span-2">
        <ThemeButton iconForMobile={false} fullWidth>
          <label htmlFor="importcustomField" className={`relative cursor-pointer`}>
            Import Custom Field
          </label>
        </ThemeButton>
        <input
          onClick={(e: any) => (e.target.value = null)}
          id="importcustomField"
          name="importcustomField"
          className="sr-only"
          onChange={handleImportFields}
          type="file"
        />
      </div>
      <SortableContext items={fields.map((d) => d._id)} strategy={() => null}>
        {fields &&
          fields.map((d) => (
            <SingleCustomField data={d} key={d._id} handleDelete={handleDelete} handleEdit={handleEdit} handleAddField={handleAddField} />
          ))}
      </SortableContext>
      {isAddField && (
        <AddField refrence="custom" fieldData={fieldData} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={fields} />
      )}
    </>
  );
};

export default CustomFields;

export const SingleCustomField = ({ data, handleEdit, handleDelete, handleAddField }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloneCustomField = (data) => {
    const sendData = data;
    sendData.fieldLabel = sendData.fieldLabel + ' Clone';
    delete sendData._id;
    handleAddField(sendData);
  };

  const handleExportFields = (data) => {
    var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = data.fieldLabel + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: data._id,
    data: {
      type: 'SidebarCustomItem',
      data,
      props: { data, handleEdit, handleDelete, handleAddField },
      label: data.fieldLabel
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <div
      style={style}
      ref={setNodeRef}
      className={`flex items-center justify-between border bg-[var(--dark-secondary,white)] p-2`}
      title={data.fieldLabel}
      {...attributes}
      {...listeners}
    >
      <p className="MuiTypography-body2 line-clamp-1">{data.fieldLabel}</p>
      <div>
        <IconButton size="small" aria-label="setting" onClick={handleClick}>
          <MoreHoriz fontSize="small" />
        </IconButton>
        <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem
            onClick={() => {
              handleEdit(data);
              handleClose();
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloneCustomField(data);
              handleClose();
            }}
          >
            Clone
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleExportFields(data);
              handleClose();
            }}
          >
            Export
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleDelete(data._id);
              handleClose();
            }}
          >
            Delete
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
};
