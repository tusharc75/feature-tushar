import React, { useContext, useState } from 'react';
import { Box, Checkbox, FormControl, IconButton, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { AiFillEdit } from 'react-icons/ai';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ConfirmationDialog from '../Helpers/ConfirmationDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ViewDialog } from './ViewDialog';
import ArrangeView from './ArrangeView';
import HtmlTooltip from '../CustomTooltipTitle';
import { startCase } from 'lodash';
import { useData } from '../../StateProvider/Provider';

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
  type,
  defaultColumns = [],
  sortBy = null,
  setSortBy = null,
  orderBy = null,
  setOrderBy = null
}) => {
  const toastConfig = useContext(CustomToastContext);

  const [isViewDeleteConfirm, setIsViewDeleteConfirm] = useState({ open: false, id: null });
  const [showSaveViewDialog, setShowSaveViewDialog] = useState({ open: false, data: null });

  const setDefaultColumns = () => {
    const temp = defaultColumns?.length > 0 ? allColumn?.filter((e: any) => defaultColumns?.includes(e?.fieldName)) : allColumn;
    setVisibleColumns([...temp]);
  };

  const handleDeleteView = () => {
    axiosInstance()
      .post(`/pdf/view/remove`, { _id: isViewDeleteConfirm.id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setDefaultColumns();
        fetchUserViews();
        setIsViewDeleteConfirm({ open: false, id: null });
        setSelectedView(null);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const {
    state: {
      user: { user }
    }
  } = useData();

  const handleSelectView = (data) => {
    setSelectedView(data);
    if (data?.columns?.length > 0) {
      setVisibleColumns(
        data.columns
          ?.map((e) => {
            const temp = allColumn.find((col) => col.fieldName === e.name);
            if (temp) return { ...temp, width: e.width, customLabel: e?.customLabel };
          })
          .filter((col) => col !== undefined)
      );
    }
    if (setSortBy && data?.sortBy) {
      setSortBy(allColumn.find((col) => col.fieldName === data?.sortBy));
    }
    if (setOrderBy && data?.orderBy) {
      setOrderBy(data?.orderBy);
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
                  <HtmlTooltip title={user?._id !== option?.user ? 'View owner can only edit' : 'Edit'}>
                    <IconButton size="small" style={{ marginRight: '20px' }} disabled={user?._id !== option?.user}>
                      <AiFillEdit />
                    </IconButton>
                  </HtmlTooltip>
                  <HtmlTooltip title={user?._id !== option?.user ? 'View owner can only delete' : 'Delete'}>
                    <IconButton
                      size="small"
                      onClick={() => setIsViewDeleteConfirm({ open: true, id: option._id })}
                      disabled={user?._id !== option?.user}
                    >
                      <RiDeleteBin6Fill />
                    </IconButton>
                  </HtmlTooltip>
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
                if (
                  val.find((e) => e.fieldName === 'Select All') &&
                  ['Select All', ...allColumn?.map((e) => e?.fieldName)].sort().toString() !==
                  val
                    ?.map((e) => e?.fieldName)
                    .sort()
                    .toString()
                ) {
                  setVisibleColumns(allColumn);
                } else if (
                  ['Select All', ...allColumn?.map((e) => e?.fieldName)].sort().toString() ===
                  val
                    ?.map((e) => e?.fieldName)
                    .sort()
                    .toString()
                ) {
                  setVisibleColumns([]);
                  setSortBy(null);
                  setOrderBy(null);
                } else {
                  setVisibleColumns(val);
                  if (!val.find((e) => e?.fieldName === sortBy?.fieldName)) {
                    setSortBy(null);
                    setOrderBy(null);
                  }
                }
              }}
              options={[{ fieldLabel: 'Select All', fieldName: 'Select All' }, ...allColumn]}
              getOptionLabel={(option) => option?.fieldLabel}
              isOptionEqualToValue={(option: any, value: any) => option.fieldName === value.fieldName}
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
            <ArrangeView columns={visibleColumns} setColumns={setVisibleColumns} />
          </Box>
        </Box>
        {type === 'PDF' && (
          <Box display="flex" justifyContent="space-between" alignItems="center" pt={4}>
            <Box width="48%" mr={1}>
              <Autocomplete
                options={visibleColumns?.filter((e) => e?.fieldName !== 'index')}
                getOptionLabel={(option: any) => option.fieldLabel}
                isOptionEqualToValue={(option: any, value: any) => option.fieldName === value.fieldName}
                fullWidth
                value={sortBy}
                onChange={(event, newValue) => {
                  setSortBy(newValue);
                  if (!newValue) setOrderBy(null);
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label={`Sort By`} variant="outlined" />}
              />
            </Box>
            <Box width="48%">
              <Autocomplete
                options={['ascending', 'descending']}
                getOptionLabel={(option) => startCase(option)}
                fullWidth
                value={orderBy}
                onChange={(event, newValue) => {
                  setOrderBy(newValue);
                }}
                size="small"
                disabled={!sortBy}
                renderInput={(params) => <TextField {...params} label={`Order By`} variant="outlined" />}
              />
            </Box>
          </Box>
        )}
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
          columns={visibleColumns}
          resource={resource}
          handleSucess={() => {
            setShowSaveViewDialog({ open: false, data: null });
            fetchUserViews();
          }}
          handleClose={() => {
            setShowSaveViewDialog({ open: false, data: null });
          }}
          viewData={showSaveViewDialog.data}
          sortBy={sortBy}
          orderBy={orderBy}
        />
      )}
    </>
  );
};
