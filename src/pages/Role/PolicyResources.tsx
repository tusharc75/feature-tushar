import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@material-ui/icons';
import { camelCase } from 'lodash';
import React from 'react';
import routes from 'src/components/Helpers/Routes';

const PolicyResources = ({
  policyResources,
  fieldOfPolicyResources,
  resourceCheckbox,
  policyFieldCheckBox,
  isPolicyCheckBoxChecked,
  handlePolicyCheckBox,
  open,
  setOpen,
  permissions,
  isEdit
}) => {
  return (
    <TableContainer className="mt-[50px] rounded-[4px] border border-[var(--common-border-color)] shadow-[0px_20.3165px_40.6331px_rgba(0,0,0,0.03)]">
      <Table stickyHeader aria-label="policy" className="roles-table">
        <TableHead>
          <TableRow>
            <TableCell className="bg-[var(--form-head-bg)_!important] text-[#2a3042_!important] dark:text-[white_!important]">Policy</TableCell>
            <TableCell align="center" className="bg-[var(--form-head-bg)_!important]">
              <FormControlLabel
                control={
                  <Checkbox
                    disabled={!isEdit}
                    checked={isPolicyCheckBoxChecked}
                    onChange={(e) => {
                      handlePolicyCheckBox('Select-All', e);
                    }}
                  />
                }
                label="Select All"
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...new Set(policyResources.map((m) => m.resource).flat())]
            ?.filter((item: string) => permissions[camelCase(item)]?.isRead)
            .map((resource: string, outerIndex) => (
              <>
                <TableRow>
                  <TableCell style={{ minWidth: 300 }}>
                    <Box
                      display="flex"
                      justifyContent={'flex-start'}
                      className="cursor-pointer "
                      alignItems={'center'}
                      onClick={() => setOpen((prevState) => ({ ...prevState, [camelCase(resource)]: !open[camelCase(resource)] }))}
                    >
                      <Typography className="tableMainHeader">{routes[camelCase(resource)]?.title || resource}</Typography>
                      {fieldOfPolicyResources.length > 0 && (
                        <Box ml={1}>
                          <IconButton size="small" aria-label="expand row">
                            {open[camelCase(resource)] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={resourceCheckbox[camelCase(resource)]}
                      disabled={!isEdit}
                      onChange={(e) => {
                        handlePolicyCheckBox('Policy-CheckBox', e, resource);
                      }}
                    />
                  </TableCell>
                </TableRow>
                {open[camelCase(resource)] &&
                  fieldOfPolicyResources
                    .filter((item) => item.resource === resource)
                    .map((obj) => (
                      <TableRow key={2}>
                        <TableCell>
                          <Typography variant="body1" style={{ fontWeight: 400 }}>
                            &emsp; {obj?.fieldLabel}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            disabled={!isEdit}
                            checked={policyFieldCheckBox[obj.field]}
                            onChange={(e) => {
                              handlePolicyCheckBox('Fields', e, obj, resource);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
              </>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PolicyResources;
