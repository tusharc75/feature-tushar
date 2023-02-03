import { Box, Checkbox, FormControlLabel, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core'
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
    return (<TableContainer style={{ paddingTop: 50 }}>
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
                                    handlePolicyCheckBox("Select-All", e)
                                }}
                            />}
                            label="Select All"
                        />
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {[...new Set(policyResources.map((m) => m.resource).flat())]?.filter((item: string) => permissions[camelCase(item)]?.isRead).map((resource: string, outerIndex) => (
                    <>
                        <TableRow>
                            <TableCell style={{ minWidth: 300 }}>
                                <Box display='flex' justifyContent={'flex-start'} alignItems={'center'}>
                                    <Typography className="tableMainHeader">{resource}</Typography>
                                    {fieldOfPolicyResources.length > 0 && <Box ml={1}>
                                        <IconButton
                                            size="small"
                                            aria-label="expand row"
                                            onClick={() => setOpen((prevState) => ({ ...prevState, [camelCase(resource)]: !(open[camelCase(resource)]) }))}
                                        >
                                            {open[camelCase(resource)] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                        </IconButton>
                                    </Box>}
                                </Box>
                            </TableCell>
                            <TableCell align="center">
                                <Checkbox
                                    checked={resourceCheckbox[camelCase(resource)]}
                                    onChange={(e) => {
                                        handlePolicyCheckBox("Policy-CheckBox", e, resource)
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                        {open[camelCase(resource)] && fieldOfPolicyResources.filter((item) => item.resource === resource).map((obj) => (
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
                                            handlePolicyCheckBox("Fields", e, obj, resource)
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                        }
                    </>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
    )
}

export default PolicyResources;