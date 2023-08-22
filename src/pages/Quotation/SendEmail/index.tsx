import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import { Button, Checkbox, Chip, Dialog, FormControl, Grid, Menu, MenuItem, TextField } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, purchaseOrder, customerAccount, supplierAccount, quotation, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import { AiFillFilePdf } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { IoMdDownload } from 'react-icons/io';
import { AiOutlineFileExcel } from 'react-icons/ai';
import contactClass from '../../../Contact/contact.module.scss';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CustomButton from 'src/components/Helpers/CustomButton';
import { GiReceiveMoney } from 'react-icons/gi';
import { VscVersions } from 'react-icons/vsc';
import PreviewDownload from 'src/components/PreviewDownload';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const SendEmail = ({
  quotationData,
  versionData,
  isSendEmail = false,
  allowedToEdit,
  versionId,
  allColumn,
  columns,
  setShowAllVersionStatus = null,
  setShowQuotationSummaryDialog = null,
  currentVersion,
  hideSummary = false,
  hideVersions = false
}) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [visibleColumnsExcel, setVisibleColumnsExcel] = useState([]);
  const [showExcelArrangeColumns, setShowExcelArrangeColumns] = useState({ open: false, type: '' });
  const [excelArrangeColumnLoading, setExcelArrangeColumnLoading] = useState(false);

  useEffect(() => {
    setVisibleColumnsExcel(['Index', 'Details', 'Type', 'Unit', 'Qty', `Price ${quotationData?.currency}`, `Final Price ${quotationData?.currency}`]);
  }, [quotationData?.currency]);

  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Box display="flex" flexWrap={'wrap'} gridGap={8}>
            {!hideSummary && (
              <Button
                onClick={() => {
                  setShowQuotationSummaryDialog(true);
                }}
                variant="outlined"
                size="small"
                startIcon={<GiReceiveMoney />}
                color="primary"
              >
                Summary
              </Button>
            )}
            {!hideVersions && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'outlined'}
                color="primary"
                size="small"
                className={'btn-outline-v1'}
                onClick={() => {
                  setShowAllVersionStatus(true);
                }}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                startIcon={isMobile && !isTablet ? null : <VscVersions />}
              >
                {isMobile && !isTablet ? <VscVersions size={20} /> : `Version : ${currentVersion}`}
              </Button>
            )}
            <Button
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="primary"
              size="small"
              className={'btn-outline-v1 '}
              onClick={() => {
                setShowExcelArrangeColumns({ open: true, type: 'Excel' });
              }}
              style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
              startIcon={isMobile && !isTablet ? null : <AiOutlineFileExcel />}
            >
              {isMobile && !isTablet ? <AiOutlineFileExcel size={20} /> : `Excel Download`}
            </Button>
            <PreviewDownload
              resource={sidebarResource.quotation}
              referenceId={quotationData?._id}
              columns={columns}
              isSendEmail={true}
              subject={`${user?.user?.brandName} Offer - ${quotationData?.quotationNumber}`}
              extraQueryParams={{ uniqueId: versionId }}
              defaultColumns={[
                'index',
                'type',
                'detail',
                'description',
                'qty',
                `price_${quotationData?.currency?.toLowerCase()}`,
                `totalPrice_${quotationData?.currency?.toLowerCase()}`,
                `tax_${quotationData?.currency?.toLowerCase()}`,
                `finalPrice_${quotationData?.currency?.toLowerCase()}`
              ]} />
          </Box>
        </Box>
      </Box>
      {showExcelArrangeColumns.open && (
        <Dialog
          open={showExcelArrangeColumns.open}
          aria-labelledby="customized-dialog-title"
          maxWidth="sm"
          onClose={() => {
            setShowExcelArrangeColumns({ open: false, type: '' });
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <CustomDialogHeader
            title={`Visible Columns in ${showExcelArrangeColumns.type}`}
            onClose={() => {
              setShowExcelArrangeColumns({ open: false, type: '' });
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
          />
          <CustomDialogContent>
            <Grid container justify="space-between" alignItems="center">
              <Grid item style={{ padding: 5, marginTop: 10 }} xs={12} md={12} sm={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    id="demo-mutiple-chip"
                    disabled={!allowedToEdit}
                    fullWidth
                    size="small"
                    multiple
                    value={visibleColumnsExcel}
                    onChange={(e, val) => {
                      if (val.includes('Select All') && ['Select All', ...allColumn].sort().toString() !== val.sort().toString()) {
                        setVisibleColumnsExcel(allColumn);
                      } else if (['Select All', ...allColumn].sort().toString() === val.sort().toString()) {
                        setVisibleColumnsExcel([]);
                      } else {
                        setVisibleColumnsExcel(allColumn.filter((d) => val.includes(d)));
                      }
                    }}
                    options={['Select All', ...allColumn]}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(option, { selected }) => (
                      <React.Fragment>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={
                            showExcelArrangeColumns &&
                              ['Select All', ...allColumn].sort().toString() === ['Select All', ...visibleColumnsExcel].sort().toString()
                              ? true
                              : selected
                          }
                        />
                        {option}
                      </React.Fragment>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} variant="outlined" label={`Visible Columns in ${showExcelArrangeColumns.type}`} placeholder="Select " />
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <CustomButton
              variant="contained"
              color="primary"
              size="small"
              loading={excelArrangeColumnLoading}
              disabled={visibleColumnsExcel.length === 0}
              onClick={(e) => {
                e.preventDefault();
                setExcelArrangeColumnLoading(true);
                axiosInstance()
                  .post(
                    `${quotation.api}/template`,
                    {
                      id: quotationData._id,
                      versionId: versionId,
                      columns: columns
                        .filter((d) => visibleColumnsExcel?.includes(d?.Header))
                        .map((d) => {
                          if (d?.accessor === 'qtyDisplay') {
                            return 'qty';
                          } else {
                            return d?.accessor.split('_')[0];
                          }
                        })
                    },
                    { responseType: 'blob' }
                  )
                  .then(({ data }) => {
                    setExcelArrangeColumnLoading(false);
                    setShowExcelArrangeColumns({ open: false, type: '' });
                    const url = window.URL.createObjectURL(new Blob([data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', quotationData.quotationNumber + '.' + 'xlsx');
                    document.body.appendChild(link);
                    link.click();
                  })
                  .catch((err) => {
                    setExcelArrangeColumnLoading(false);
                    toastConfig.setToastConfig(err);
                  });
              }}
            >
              Download
            </CustomButton>
          </CustomDialogFooter>
        </Dialog>
      )}
    </>
  );
};

export default SendEmail;
