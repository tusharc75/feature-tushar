import { useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid, Typography } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import axiosInstance from 'src/axios/axiosInstance';
import { ATTACHMENT_TYPE, CustomDialogTransition } from 'src/constants/helpers';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';
import { isMobile, isTablet } from 'react-device-detect';

const Diagram = ({ resource, referenceId }) => {
  const [rowData, setRowData] = useState(null);
  const [attachemntDialog, setAttachemntDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, [resource, referenceId]);

  const fetchData = async () => {
    const {
      data: { data }
    } = await axiosInstance().get(
      `/attachment/resource-attachment-type?resource=${resource}&referenceId=${referenceId}&attachmentType=${ATTACHMENT_TYPE.diagram}`
    );
    setRowData(data);
    setSelectedFile(data[0]);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5} md={5} lg={4} xl={3}>
          <Box className="container-with-border" p={'20px'} height={'calc(100vh - 150px)'}>
            <Box mb={1} display="flex" justifyContent="end" alignItems="center">
              <Button
                variant={'outlined'}
                color="primary"
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setAttachemntDialog(true);
                }}
                aria-controls="add-menu"
              >
                Add Attachment
              </Button>
            </Box>
            <Box>
              {rowData &&
                rowData?.map((data, index) => {
                  return (
                    <Box
                      p={2}
                      onClick={() => {
                        setSelectedFile(data);
                      }}
                      style={{
                        border:
                          selectedFile?._id === data?._id
                            ? '1px solid var(--dark-active-border-color,#298B88)'
                            : '1px solid var(--dark-mode-border-color, rgb(224, 224, 224))',
                        borderTopWidth: index === 0 ? 1 : 0,
                        cursor: 'pointer'
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        <Box
                          style={{
                            backgroundColor: 'var(--dark-primary, var(--primary))',
                            color: 'white',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            lineHeight: '20px',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            flexShrink: 0,
                            top: '4px',
                            left: 0
                          }}
                        >
                          <span>{index + 1}</span>
                        </Box>
                        <Box ml={'10px'}>
                          <Typography style={{ fontWeight: 600 }}>{data?.name}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={7} md={7} lg={8} xl={9}>
          <Box
            className="container-with-border"
            p={'20px'}
            style={{
              overflow: 'hidden',
              minHeight: '100%'
            }}
          >
            <Box>
              {selectedFile &&
                selectedFile?.file?.map((file) => {
                  return (
                    <Box>
                      <Typography>{file?.name}</Typography>
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </Grid>
      </Grid>
      {attachemntDialog && (
        <Dialog
          open={true}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setAttachemntDialog(false);
            }
            setFullScreen(false);
          }}
          fullWidth
        >
          <ManageAttachment
            attachmentId={null}
            handleClose={() => {
              setAttachemntDialog(false);
              setFullScreen(false);
            }}
            relatedTo={[{ type: resource, referenceId: referenceId, access: true }]}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            fetchData={fetchData}
          />
        </Dialog>
      )}
    </Box>
  );
};

export default Diagram;
