import React, { useContext, useState } from 'react';
import { Box, Checkbox, FormControl, IconButton, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { AiFillEdit } from 'react-icons/ai';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import ConfirmationDialog from '../Helpers/ConfirmationDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ViewDialog } from './ViewDialog';
import ArrangeView from './ArrangeView';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export const PreviewFields = ({
    views,
    selectedView,
    setSelectedView,
    visibleColumns,
    setVisibleColumns,
    fetchUserViews,
    allColumn,
    resource,
    type
}) => {
    const toastConfig = useContext(CustomToastContext);

    const [isViewDeleteConfirm, setIsViewDeleteConfirm] = useState({ open: false, id: null });
    const [showSaveViewDialog, setShowSaveViewDialog] = useState({ open: false, data: null });


    const handleDeleteView = () => {
        axiosInstance()
            .post(`/pdf/view/remove`, { _id: isViewDeleteConfirm.id })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
                fetchUserViews();
                setIsViewDeleteConfirm({ open: false, id: null });
                setSelectedView(null);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const handleSelectView = (data) => {
        setSelectedView(data);
        if (data && data.columns) {
            const columnsArray = data?.columns?.split(',')?.map((item) => item?.trim());
            setVisibleColumns(columnsArray?.map(e => { return allColumn.find(col => col.fieldName === e) }).filter(col => col !== undefined));
        }
    };

    return (
        <>
            <FormControl fullWidth>
                <Box pb={5}>
                    <Autocomplete
                        fullWidth
                        size="small"
                        value={selectedView}
                        onChange={(e, selectedOption) => {
                            handleSelectView(selectedOption);
                        }}
                        getOptionLabel={(option) => option.name}
                        renderOption={(option) => (
                            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} width={'100%'}>
                                <span style={{ width: 'calc(100% - 71px)' }}>{option?.name}</span>
                                <Box>
                                    <IconButton size="small" style={{ marginRight: '20px' }}>
                                        <AiFillEdit />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setIsViewDeleteConfirm({ open: true, id: option._id })}>
                                        <RiDeleteBin6Fill />
                                    </IconButton>
                                </Box>
                            </Box>
                        )}
                        id="controllable-states-demo"
                        options={views}
                        renderInput={(params) => <TextField {...params} fullWidth label={`Select View ${type}`} variant="outlined" />}
                    />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box width="94%">
                        <Autocomplete
                            id="demo-mutiple-chip"
                            fullWidth
                            size="small"
                            multiple
                            value={visibleColumns}
                            onChange={(e, val) => {
                                if (val.find((e) => e.fieldName === 'Select All') && ['Select All', ...allColumn?.map((e) => e?.fieldName)].sort().toString() !== val?.map((e) => e?.fieldName).sort().toString()) {
                                    setVisibleColumns(allColumn);
                                } else if (['Select All', ...allColumn?.map((e) => e?.fieldName)].sort().toString() === val?.map((e) => e?.fieldName).sort().toString()) {
                                    setVisibleColumns([]);
                                } else {
                                    setVisibleColumns(val);
                                }
                            }}
                            options={[{ fieldLabel: 'Select All', fieldName: 'Select All' }, ...allColumn]}
                            getOptionLabel={(option) => option?.fieldLabel}
                            getOptionSelected={(option: any, value: any) =>
                                option.fieldName === value.fieldName
                            }
                            disableCloseOnSelect
                            renderOption={(option, { selected }) => (
                                <React.Fragment>
                                    <Checkbox
                                        icon={icon}
                                        checkedIcon={checkedIcon}
                                        style={{ marginRight: 8 }}
                                        checked={
                                            ['Select All', ...allColumn?.map((e) => e?.fieldName)].sort().toString() ===
                                                ['Select All', ...visibleColumns?.map((e) => e?.fieldName)].sort().toString()
                                                ? true
                                                : selected
                                        }
                                    />
                                    {option.fieldLabel}
                                </React.Fragment>
                            )}
                            renderInput={(params) => <TextField {...params} variant="outlined" label={`Visible Columns in ${type}`} placeholder="Select" />}
                        />
                    </Box>
                    <Box width="5%">
                        <ArrangeView
                            columns={visibleColumns}
                            setColumns={setVisibleColumns} />
                    </Box>
                </Box>
            </FormControl>

            {isViewDeleteConfirm.open && (
                <ConfirmationDialog
                    open={true}
                    message={`Are you sure you want to delete ?`}
                    onClose={() => setIsViewDeleteConfirm({ open: false, id: null })}
                    onOk={handleDeleteView}
                />
            )}
            {showSaveViewDialog.open && (
                <ViewDialog
                    columns={visibleColumns?.map((e) => e?.fieldName)}
                    resource={resource}
                    handleSucess={() => {
                        setShowSaveViewDialog({ open: false, data: null });
                        fetchUserViews();
                    }}
                    handleClose={() => {
                        setShowSaveViewDialog({ open: false, data: null });
                    }}
                    viewData={showSaveViewDialog.data}
                />
            )}
        </>
    );
};
