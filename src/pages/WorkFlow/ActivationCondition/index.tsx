import { Box, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Fragment, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import AddConditionDialog from 'src/pages/WorkFlow/ActivationCondition/AddConditionDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ActivationCondition = ({ resource, fetchWorkFlowData, activationCondition = [], loading, id }) => {
  const toastConfig = useContext(CustomToastContext);
  const [resourceFields, setResourceFields] = useState(null);
  const [open, setOpen] = useState({ open: false, data: null });
  const [data, setData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchResourceFields();
  }, []);

  useEffect(() => {
    if (activationCondition?.length > 0 && resourceFields) {
      fetchFieldvalue();
    }
  }, [resourceFields, activationCondition]);

  const fetchResourceFields = async () => {
    try {
      const { data } = await axiosInstance().get(`/field?resource=${resource}`);
      const fields = data?.data?.map((ele) => ele?.fieldData);
      setResourceFields(fields);
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  const fetchFieldvalue = async () => {
    const query: any = [];
    activationCondition.forEach((f) => {
      const fieldData = resourceFields?.find((_f) => _f?.fieldName === f?.fieldName);
      if (fieldData?.lookup || fieldData?.dataList) {
        if (query?.find((q) => q?.fieldName === fieldData?.fieldName)) {
          query?.forEach((q) => {
            if (q?.fieldName === fieldData?.fieldName) {
              q._id = [...new Set([...q?._id, ...f?.fieldValue?.split(',')])];
            }
          });
        } else {
          query.push({
            resource: fieldData?.lookup ? fieldData?.lookupResource : '',
            dataList: false,
            fieldName: fieldData?.fieldName,
            _id: f?.fieldValue?.split(',')
          });
        }
      }
    });
    if (query?.length) {
      const {
        data: { data }
      } = await axiosInstance().get(`/sa-formbuilder/resource/fieldLabel?data=${JSON.stringify(query)}`);
      setData(data);
    }
  };

  const handleDelete = (condition) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.workflow.path}/${id}/activation-condition/delete`, { activationConditionId: condition?._id })
      .then(() => {
        setDeleting(false);
        fetchWorkFlowData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        setDeleteData(null);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Box className="conditions-container flex flex-col gap-1 sm:mb-3 sm:p-3 md:mb-4 md:p-2">
        <Box>
          <ThemeButton
            buttonType="theme"
            onClick={() => {
              setOpen({ open: true, data: null });
            }}
          >
            Add Condition
          </ThemeButton>
        </Box>
        {resourceFields?.length > 0 && !loading ? (
          activationCondition?.length > 0 ? (
            activationCondition?.map((ele, j) => (
              <Box
                key={ele._id}
                border={1}
                borderColor="var(--common-border-color)"
                p={1}
                px={1}
                display={'flex'}
                justifyContent={'space-between'}
                alignItems={'center'}
                mt={2}
                borderRadius={'5px'}
              >
                <Typography variant="body2">{`${resourceFields?.find((f) => ele?.fieldName === f?.fieldName)?.fieldLabel} is ${resourceFields?.find((f) => f?.fieldName === ele?.fieldName)?.lookup
                    ? data && data[ele?.fieldName]
                      ? data[ele?.fieldName]
                        ?.filter((d) => ele['fieldValue']?.split(',').includes(d?.optionValue))
                        ?.map((v) => v?.optionLabel)
                        ?.join(', ')
                      : ''
                    : ele['fieldValue']
                  }`}</Typography>

                <div className="min-w-fit">
                  <HtmlTooltip title={'Edit'}>
                    <IconButton
                      size="small"
                      aria-label="Edit"
                      onClick={() => {
                        setOpen({ open: true, data: ele });
                      }}
                    >
                      <EditIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </HtmlTooltip>
                  <HtmlTooltip title={'Delete'}>
                    <IconButton
                      size="small"
                      aria-label="Delete"
                      onClick={() => {
                        setDeleteData(ele);
                      }}
                    >
                      <DeleteIcon fontSize="small" color={'error'} />
                    </IconButton>
                  </HtmlTooltip>
                </div>
              </Box>
            ))
          ) : (
            <Box minHeight={'300px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
              Activation Conditions not added yet!
            </Box>
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {open.open && (
        <AddConditionDialog
          fields={resourceFields}
          data={open.data}
          activationCondition={activationCondition}
          onClose={() => {
            setOpen({ open: false, data: null });
          }}
          onSuccess={() => {
            fetchWorkFlowData();
            setOpen({ open: false, data: null });
          }}
          id={id}
        />
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete condition?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
    </Fragment>
  );
};

export default ActivationCondition;
