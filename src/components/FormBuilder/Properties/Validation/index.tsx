import { Box, Button, Checkbox, FormControlLabel, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { MoreHoriz, Settings } from '@material-ui/icons';
import { useState } from 'react';
import { OPERATOR } from 'src/components/FormBuilder/helper';
import ValidationDialog from 'src/components/FormBuilder/Properties/Validation/ValidationDialog';

const Validation = ({ values, setFieldValue, fields, fieldsToExclude }) => {
  const [anchorElSetting, setAnchorElSetting] = useState(null);
  const [anchorEl, setAnchorEl] = useState({});
  const [open, setOpen] = useState({ open: false, data: null });

  const handleClose = (i) => {
    setAnchorEl({ ...anchorEl, [i]: null });
  };

  const handleDeleteValidation = (fieldName) => {
    const dateValidation = values?.dateValidation || [];
    setFieldValue(
      'dateValidation',
      dateValidation?.filter((d) => d?.fieldName != fieldName)
    );
  };

  return (
    <Box mb={2}>
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              name="restrictFutureDate"
              checked={values['restrictFutureDate']}
              onChange={(e) => {
                setFieldValue('restrictFutureDate', e.target.checked);
              }}
              color="primary"
            />
          }
          label="Restrict Future Date"
        />
      </Box>
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              name="restrictBackDate"
              checked={values['restrictBackDate']}
              onChange={(e) => {
                setFieldValue('restrictBackDate', e.target.checked);
              }}
              color="primary"
            />
          }
          label="Restrict Back Date"
        />
      </Box>
      <Box pl={0.5} mt={1}>
        <Typography variant="subtitle2">VALIDATION...</Typography>
      </Box>

      <Box border={1} borderColor="var(--common-border-color)" mt={1} p={1}>
        <Box display={'flex'} justifyContent={'end'} alignItems={'center'}>
          <IconButton
            aria-label="setting"
            size="small"
            onClick={(e) => {
              setAnchorElSetting(e.currentTarget);
            }}
            disabled={!values?.dateValidation?.length}
          >
            <Settings fontSize="small" />
          </IconButton>
          <Menu
            id="simple-menu-setting"
            anchorEl={anchorElSetting}
            keepMounted
            open={Boolean(anchorElSetting)}
            onClose={() => {
              setAnchorElSetting(null);
            }}
          >
            <MenuItem
              onClick={() => {
                setFieldValue('dateValidation', []);
                setAnchorElSetting(null);
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>

        {values &&
          values?.dateValidation &&
          values?.dateValidation?.length > 0 &&
          values?.dateValidation?.map((d, i) => (
            <Box
              border={1}
              borderColor="var(--common-border-color)"
              p={1}
              px={2}
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              mt={1}
            >
              <Typography variant="body2">{`${OPERATOR?.find((o) => o?.optionValue === d?.operator)?.optionLabel} from ${fields?.find((f) => f?.fieldName === d?.fieldName)?.fieldLabel}`}</Typography>
              <Box>
                <IconButton
                  aria-label="setting"
                  size="small"
                  onClick={(e) => {
                    setAnchorEl({ ...anchorEl, [`${i}`]: e.currentTarget });
                  }}
                >
                  <MoreHoriz fontSize="small" />
                </IconButton>
                <Menu
                  id="simple-menu"
                  anchorEl={anchorEl[`${i}`]}
                  keepMounted
                  open={Boolean(anchorEl[`${i}`])}
                  onClose={() => {
                    handleClose(`${i}`);
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleClose(`${i}`);
                      setOpen({ open: true, data: d });
                    }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleDeleteValidation(d?.fieldName);
                      handleClose(`${i}`);
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          ))}

        <Box mt={2}>
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => {
              setOpen({ open: true, data: null });
            }}
          >
            Add Validation
          </Button>
        </Box>
      </Box>

      {open?.open && (
        <ValidationDialog
          onClose={() => {
            setOpen({ open: false, data: null });
          }}
          data={open?.data}
          fields={fields}
          fieldsToExclude={fieldsToExclude}
          fieldValue={values}
          setValue={setFieldValue}
        />
      )}
    </Box>
  );
};

export default Validation;
