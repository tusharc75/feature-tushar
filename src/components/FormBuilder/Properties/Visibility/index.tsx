import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, TextField, Typography } from '@material-ui/core';
import ConditionDialog from './ConditionDialog';
import FieldList from '../../FieldList';
import { MoreHoriz } from '@material-ui/icons';

const Visibility = ({ values, setFieldValue, fields, fieldData }) => {
  const [open, setOpen] = useState({ open: false, condition: null });
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Box>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={() => {
            setOpen({ open: true, condition: null });
          }}
        >
          Add Condition
        </Button>
      </Box>
      <Box mt={1} mb={2}>
        {values &&
          values?.visibilityCondition?.map((condition) => (
            <Box
              border={'1px solid rgba(0, 0, 0, 0.38)'}
              borderRadius={'4px'}
              p={0.5}
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              width={'70%'}
              mt={1}
            >
              <Box border={'1px solid rgba(0, 0, 0, 0.38)'} borderRadius={'4px'} px={2} py={1}>
                <Typography variant="body2">{fields?.find((f) => f?.fieldName === condition?.fieldName)?.fieldLabel}</Typography>
              </Box>
              <Typography variant="body2">
                {FieldList[fields?.find((f) => f?.fieldName === condition?.fieldName)?.type?.toUpperCase()]?.label}
              </Typography>

              <Typography variant="body2">{condition?.value}</Typography>
              <Box>
                <IconButton
                  aria-label="setting"
                  onClick={(e) => {
                    setAnchorEl(e.currentTarget);
                  }}
                >
                  <MoreHoriz fontSize="small" />
                </IconButton>
              </Box>
              <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                <>
                  <MenuItem
                    onClick={() => {
                      handleClose();
                      setOpen({ open: true, condition: condition });
                    }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleClose();
                      setFieldValue('visibilityCondition', values?.visibilityCondition?.filter(c => c?.fieldName != condition?.fieldName));
                    }}
                  >
                    Delete
                  </MenuItem>
                </>
              </Menu>
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
          setFieldValue={setFieldValue}
          fields={fields}
          fieldData={fieldData}
        />
      )}
    </Box>
  );
};

export default Visibility;
