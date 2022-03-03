import { Box, Checkbox, FormControlLabel,IconButton,Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core'
import { KeyboardArrowDown, KeyboardArrowUp } from '@material-ui/icons'
import { camelCase } from 'lodash'
import React from 'react'

const PolicyResources = (
    {
        policyResources,
        fieldOfPolicyResources,
        resourceCheckbox,
        policyFieldCheckBox,
        isPolicyCheckBoxChecked,
        handlePolicyCheckBox,
        open,
        setOpen,
        permissions
    }
) => {
    return (
        <TableContainer style={{ height: 400, minHeight: 400, paddingTop: 50 }}>
            <Table
                stickyHeader
                aria-label="policy"
                className="roles-table"
            >
                <TableHead>
                    <TableRow>
                        <TableCell>Policy</TableCell>
                        <TableCell align="center">
                            <FormControlLabel
                                control={<Checkbox
                                    disabled={false}
                                    checked={isPolicyCheckBoxChecked}
                                    onChange={(e) => {
                                        // setIsPolicyCheckBoxChecked(e.target.checked)
                                        // setResourceCheckBox({ rentalManagement: e.target.checked, purchaseOrder: e.target.checked, sublease: e.target.checked })
                                        // SetPolicyFieldCheckBox({ isPricingPurchaseOrder: e.target.checked, isPricingRentalManagement: e.target.checked, isPricingSublease: e.target.checked })
                                        handlePolicyCheckBox("Select-All", e)
                                    }}
                                />}
                                label="Select All"
                            />
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {policyResources.filter((item) => permissions[camelCase(item.resource)].isRead).map((resource, outerIndex) => (
                        <>
                            <TableRow>
                                <TableCell style={{ minWidth: 300 }}>
                                    <Box display='flex' justifyContent={'flex-start'} alignItems={'center'}>
                                        <Typography className="tableMainHeader">{resource.resource}</Typography>
                                        {fieldOfPolicyResources.length > 0 && <Box ml={1}>
                                            <IconButton
                                                size="small"
                                                aria-label="expand row"
                                                onClick={() => setOpen((prevState) => ({ ...prevState, [camelCase(resource.resource)]: !(open[camelCase(resource.resource)]) }))}
                                            >
                                                {open[camelCase(resource.resource)] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                            </IconButton>
                                        </Box>}
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={resourceCheckbox[camelCase(resource.resource)]}
                                        onChange={(e) => {
                                            // setResourceCheckBox((prevState) => ({ ...prevState, [camelCase(resource.resource)]: e.target.checked }))
                                            // SetPolicyFieldCheckBox((prevState) => ({ ...prevState, [resource.fieldName]: e.target.checked }))
                                            handlePolicyCheckBox("Policy-CheckBox", e, resource)
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                            {
                                open[camelCase(resource.resource)] && fieldOfPolicyResources.filter((item) => item.resource === resource.resource).map((obj) => (
                                    <TableRow key={2}>
                                        <TableCell>
                                            <Typography variant="body1">
                                                &emsp;{" "}
                                                {obj?.fieldLabel}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Checkbox
                                                disabled={false}
                                                checked={policyFieldCheckBox[obj.field]}
                                                onChange={(e) => {
                                                    // SetPolicyFieldCheckBox((prevState) => ({ ...prevState, [obj.field]: e.target.checked }))
                                                    // setResourceCheckBox((prevState) => ({ ...prevState, [camelCase(resource.resource)]: e.target.checked }))
                                                    handlePolicyCheckBox("Fields", e, obj, resource)
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </>

                    ))
                    }
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default PolicyResources;