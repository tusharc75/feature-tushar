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
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
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
      <Table stickyHeader size="small" aria-label="policy" className="roles-table">
        <TableHead>
          <TableRow>
            <TableCell className="bg-[var(--form-head-bg)_!important] text-[#2a3042_!important] dark:text-[white_!important]">Policy</TableCell>
            <TableCell className="bg-[var(--form-head-bg)_!important]">
              <FormControlLabel
                sx={{ m: 0 }}
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
                <TableRow className="[&:not(:last-child)]:shadow-[0_1px_0px_0px_var(--common-border-color)]">
                  <TableCell sx={{ minWidth: 300, py: 0 }}>
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
                  <TableCell sx={{ minWidth: 300, py: 0 }}>
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
                      <TableRow key={2} className="[&:not(:last-child)]:shadow-[0_1px_0px_0px_var(--common-border-color)]">
                        <TableCell sx={{ minWidth: 300, py: 0 }}>
                          <Typography variant="body1" style={{ fontWeight: 400 }}>
                            &emsp; {obj?.fieldLabel}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 300, py: 0, pl: 4 }}>
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
