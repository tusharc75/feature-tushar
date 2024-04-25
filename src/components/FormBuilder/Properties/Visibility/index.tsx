import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@material-ui/core';
import ConditionDialog from './ConditionDialog';
import { MoreHoriz } from '@material-ui/icons';
import axiosInstance from 'src/axios/axiosInstance';

const Visibility = ({ values, setFieldValue, fields, fieldData }) => {
  const [open, setOpen] = useState({ open: false, condition: null });
  const [anchorEl, setAnchorEl] = useState({});
  const [data, setData] = useState({});

  const handleClose = (i) => {
    setAnchorEl({ ...anchorEl, [i]: null });
  };

  useEffect(() => {
    fetchFieldvalue();
  }, [values?.visibilityCondition]);

  const fetchFieldvalue = async () => {
    if (
      values &&
      values?.visibilityCondition?.length > 0 &&
      values?.visibilityCondition?.some(
        (c) => fields?.find((f) => f?.fieldName === c?.fieldName)?.lookup || fields?.find((f) => f?.fieldName === c?.fieldName)?.dataList
      )
    ) {
      const data: any = [];
      values?.visibilityCondition?.forEach((c) => {
        if (fields?.find((f) => f?.fieldName === c?.fieldName)?.lookup || fields?.find((f) => f?.fieldName === c?.fieldName)?.dataList) {
          data.push({
            resource: fields?.find((f) => f?.fieldName === c?.fieldName)?.lookup
              ? fields?.find((f) => f?.fieldName === c?.fieldName)?.lookupResource
              : fields?.find((f) => f?.fieldName === c?.fieldName)?.dataList
              ? fields?.find((f) => f?.fieldName === c?.fieldName)?.dataListId
              : '',
            dataList: fields?.find((f) => f?.fieldName === c?.fieldName)?.dataList ? true : false,
            fieldName: c?.fieldName,
            _id: c?.value?.split(',')
          });
        }
      });
      const response = await axiosInstance().get(`/sa-formbuilder/resource/fieldLabel?data=${JSON.stringify(data)}`);
      setData(response?.data?.data);
    }
  };

  return (
    <Box>
      <Box pl={0.5}>
        <Typography variant="subtitle2">ONLY SHOW WHEN...</Typography>
      </Box>
      <Box mt={2}>
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => {
            setOpen({ open: true, condition: null });
          }}
        >
          Add Condition
        </Button>
      </Box>
      <Box mt={2} mb={2}>
        {values &&
          values?.visibilityCondition?.map((condition, i) => (
            <Box
              border={'1px solid rgba(0, 0, 0, 0.38)'}
              borderRadius={'4px'}
              p={0.5}
              px={2}
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              mt={1}
            >
              <Typography variant="body2">{`${fields?.find((f) => f?.fieldName === condition?.fieldName)?.fieldLabel} is ${
                fields?.find((f) => f?.fieldName === condition?.fieldName)?.lookup ||
                fields?.find((f) => f?.fieldName === condition?.fieldName)?.dataList
                  ? data[condition?.fieldName]?.map(m => m?.optionLabel)?.join(', ')
                  : condition?.value
              }`}</Typography>
              <Box>
                <IconButton
                  aria-label="setting"
                  size="small"
                  onClick={(e) => {
                    setAnchorEl({ ...anchorEl, [i]: e.currentTarget });
                  }}
                >
                  <MoreHoriz fontSize="small" />
                </IconButton>
                <Menu
                  id="simple-menu"
                  anchorEl={anchorEl[i]}
                  keepMounted
                  open={Boolean(anchorEl[i])}
                  onClose={() => {
                    handleClose(i);
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleClose(i);
                      setOpen({ open: true, condition: condition });
                    }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleClose(i);
                      setFieldValue(
                        'visibilityCondition',
                        values?.visibilityCondition?.filter((c) => c?.fieldName != condition?.fieldName)
                      );
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          ))}
      </Box>
      {open?.open && (
        <ConditionDialog
          onClose={() => {
            setOpen({ open: false, condition: null });
          }}
          data={open?.condition}
          values={values}
          setValue={setFieldValue}
          fields={fields}
          fieldData={fieldData}
        />
      )}
    </Box>
  );
};

export default Visibility;
