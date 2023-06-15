import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from '../../Routes';
import { CustomDialogTransition, getObjKeys, setFieldsInAscendingOrder, wellMaster, yupSchema } from 'src/constants/helpers';
import { Box, Button, CircularProgress, Dialog, Grid, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { isEmpty, isEqual, orderBy, set } from 'lodash';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from '../../FormTypes';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from '../../CustomButton';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import CommonSkeleton from '../../CommonSkeleton';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { BiAddToQueue } from 'react-icons/bi';
import MaUTable from '@material-ui/core/Table';
import {
  useTable,
  useExpanded,
  useRowSelect,
  useFlexLayout,
  useSortBy,
  useResizeColumns,
  useFilters,
  useColumnOrder,
  usePagination,
  useRowState
} from 'react-table';
import { useSticky } from 'react-table-sticky';
import { Add, Delete } from '@material-ui/icons';

function AddMultiple({ fieldData, onClose, onSuccess }) {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const [entries, setEntries] = useState([]);
  const [entryValues, setEntryValues] = useState([]);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(true);
  const [allFields, setAllFields] = useState([]);
  const [title, setTitle] = useState('');
  const ref = useRef(null);
  const [error, setError] = useState<any>({});
  const [touched, setTouched] = useState<any>({});

  useEffect(() => {
    fetchFields();
  }, [fieldData]);

  const fetchFields = () => {
    setLoading(true);
    axiosInstance()
      .get(`/field?resource=${fieldData?.lookupResource || ''}`)
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data
          .filter((obj) => obj.isCreate)
          ?.map((d: any) => d.fieldData)
          ?.map((d) => {
            delete d.lookup;
            return d;
          });
        setTitle(`Create Multiple ${fieldData?.lookupResource || ''}`);
        let initialData: any = { ...getObjKeys('', fieldsDataForCreate) };

        setAllFields(fieldsDataForCreate);
        setEntries([[...fieldsDataForCreate]]);
        setEntryValues([{ ...initialData }]);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const addEntry = () => {
    const fields = allFields?.map((field) => {
      delete field.lookup;
      return {
        ...field,
        fieldName: `${field.fieldName}_${entries.length}`
      };
    });
    let initialData: any = { ...getObjKeys('', fields) };
    setEntries([...entries, fields]);
    setEntryValues([...entryValues, { ...initialData }]);
  };

  // For removing an entry
  const removeEntry = (index) => {
    const deletedEntry = entries[index];
    const errors = { ...error };
    deletedEntry?.forEach((field) => {
      delete errors[`${field.fieldName}`];
    });
    setError(errors);
    setEntries(entries?.filter((_, i) => i !== index));
    setEntryValues(entryValues?.filter((_, i) => i !== index));
    // remove error string too
  };

  const handleSubmit = (values) => {
    const error = validate(entryValues);
    if (Object.keys(error).length > 0) return;

    const datas = values?.map((item) => {
      const newItem = {};
      Object.keys(item)?.forEach((key) => {
        const newKey = key.split('_')[0];
        newItem[newKey] = item[key];
      });
      return newItem;
    });
    axiosInstance()
      .post(`/dynamic-form/multi`, datas, {
        headers: {
          Resource: fieldData?.lookupResource
        }
      })
      .then(({ data: { data, message } }) => {
        setSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: message
        });
        const primaryField = allFields?.find((field) => field?.primaryField && field?.required);
        const dataToReturn = data?.map((d, i) => {
          const data = {
            default: i === 0 ? true : false,
            optionLabel: d[primaryField?.fieldName],
            optionValue: d._id
          };
          if (fieldData?.lookupDependentOn && fieldData?.lookupDependentOn !== '') {
            data[fieldData?.lookupDependentOn] = d[fieldData?.lookupDependentOn];
          }
          return data;
        });
        onSuccess(dataToReturn);
        onClose();
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };
  //   useEffect(() => {
  //     !isEmpty(entryValues) && validate(entryValues);
  //   }, [entryValues]);

  function validate(values) {
    const errors = {};
    const touched = {};
    values?.forEach((item, index) => {
      Object.keys(item)?.forEach((key) => {
        const field = allFields?.find((field) => field.fieldName === key?.split('_')[0]);
        if (field?.required && field?.type === 'singleLine' && item[key] === '') {
          errors[key] = field?.fieldLabel + ' is required';
          touched[key] = true;
        }
        if (field?.required && field?.type === 'multiSelect' && item[key]?.length === 0) {
          errors[key] = field?.fieldLabel + ' is required';
          touched[key] = true;
        }
        if (field?.required && field?.type === 'dropDown' && item[key]?.length === 0) {
          errors[key] = field?.fieldLabel + ' is required';
          touched[key] = true;
        }
      });
    });
    setError(errors);
    setTouched(touched);

    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      open={true}
    >
      {entries?.length ? (
        <Fragment>
          <CustomDialogHeader
            title={title}
            onClose={(e, reason) => {
              onClose();
              if (!isEqual(ref.current.values, entryValues)) {
                setShowConfirmDialog(true);
              } else {
                onClose();
              }
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
          />
          <CustomDialogContent>
            <div
              style={{
                display: 'block',
                overflow: 'auto',
                height: '100%'
              }}
              className="border custom-react-table editable-table-v1"
            >
              <MaUTable size="small" className="tableWrap table sticky">
                <TableHead style={{ overflowY: 'auto', overflowX: 'hidden' }} className="header">
                  <TableRow key={'thead'} className="tr">
                    {entries[0]?.map((field, index) => (
                      <TableCell key={`${index}-${field?.fieldName}`} className="th text-truncate table-header overflow-initial">
                        <div className="d-flex align-items-center justify-content-space-between pos-rel">
                          <div className="d-flex gap-2 align-items-center">
                            <span>{field?.fieldLabel}</span>
                          </div>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell
                      key={`Index add`}
                      className="th text-truncate table-header overflow-initial"
                      style={{ width: '10px', position: 'sticky', right: 0, backgroundColor: '#ffffff' }}
                    >
                      <div
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.preventDefault();
                          addEntry();
                        }}
                      >
                        <Add fontSize="small" color={'primary'} />
                      </div>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody
                  style={{
                    overflowY: 'scroll',
                    overflowX: 'hidden'
                  }}
                  className="body"
                >
                  {entries?.map((iData, idx) => {
                    return (
                      <TableRow className="tr" style={{ overflow: 'auto' }}>
                        {iData?.map((field, i) => {
                          return (
                            <TableCell className={`td`} style={{ minWidth: '300px', maxWidth: '300px' }}>
                              <FormTypes
                                {...field}
                                disabled={field.disableOnEdit}
                                values={entryValues[idx] || {}}
                                errors={error}
                                fields={iData}
                                fieldData={field}
                                touched={touched || {}}
                                label={field.fieldLabel}
                                name={field.fieldName}
                                type={field.type}
                                options={field.option}
                                setFieldValue={(name, value) => {
                                  setEntryValues((prevState) => {
                                    const prevData = [...prevState];
                                    prevData[idx][name] = value;
                                    return prevData;
                                  });
                                }}
                                required={field.required}
                                fullWidth
                                isTooltip={field?.isTooltip || false}
                                tooltipMessage={field?.tooltipMessage}
                                size="small"
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell
                          key={`Index ${idx}`}
                          className="td table-header action-column"
                          style={{
                            width: '10px',
                            position: 'sticky',
                            right: 0,
                            backgroundColor: '#ffffff'
                          }}
                        >
                          {entries?.length !== 1 && (
                            <div
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.preventDefault();
                                removeEntry(idx);
                              }}
                            >
                              <Delete fontSize="small" color={'error'} />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </MaUTable>
            </div>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              disabled={submitting}
              type="button"
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                if (!isEmpty(entryValues)) {
                  setShowConfirmDialog(true);
                } else {
                  onClose();
                }
              }}
            >
              Cancel
            </Button>
            <CustomButton
              loading={loading}
              variant="contained"
              color="primary"
              startIcon={submitting && <CircularProgress size={20} color="inherit" />}
              disabled={submitting || isEmpty(entryValues)}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(entryValues);
              }}
            >
              Save
            </CustomButton>
          </CustomDialogFooter>
          {showConfirmDialog ? (
            <ConfirmCancelDialog
              close={() => setShowConfirmDialog(false)}
              open={showConfirmDialog}
              onSave={() => {
                setShowConfirmDialog(false);
                // handleScroll(errors);
                handleSubmit(entryValues);
              }}
              onClose={() => {
                setShowConfirmDialog(false);
                onClose();
              }}
            />
          ) : null}
        </Fragment>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}

export default AddMultiple;
