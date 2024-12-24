import { Box, Button, Chip, Grid, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { useAppTheme } from 'src/constants/AppConfig';
import { IRT_APPROVER_STATUS } from 'src/constants/helpers';
import AssignUserDialog from './AssignUserDialog';

const Approver = ({ irtTicketData }) => {
  const [approver, setAapprover] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [selected, setSelected] = useState(null);
  const [theme] = useAppTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axiosInstance()
      .get(`${routes?.irtTicket?.path}/approver/${irtTicketData?._id}`)
      .then(({ data: { data } }) => {
        setAapprover(data);
      });
  };

  const handleDelete = (id) => {
    axiosInstance()
      .put(`${routes?.irtTicket?.path}/approver/remove/${irtTicketData?._id}`, { ids: [id] })
      .then(({ data: { data } }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Deleted Successfully'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5} md={4} lg={3}>
          <Grid
            container
            spacing={2}
            style={{
              flexDirection: 'column'
            }}
          >
            <Box pl={1} pb={2}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  setOpenDialog(true);
                }}
              >
                Add Approver
              </Button>
            </Box>
            {approver ? (
              approver?.map((item, index) => (
                <Grid item xs={12} key={index}>
                  <Box
                    style={{
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      backgroundColor:
                        item.status === IRT_APPROVER_STATUS.send
                          ? theme === 'light'
                            ? 'hsl(194, 100%, 94%)'
                            : 'hsla(194, 100%, 64%, .5)'
                          : item.status === IRT_APPROVER_STATUS.approved
                            ? theme === 'light'
                              ? 'hsl(96, 100%, 94%)'
                              : 'hsla(96, 100%, 64%, .5)'
                            : item.status === IRT_APPROVER_STATUS.declined
                              ? theme === 'light'
                                ? 'hsl(0, 100%, 96%)'
                                : 'hsla(0, 100%, 66%, .5)'
                              : 'white',
                      borderColor: selected?._id === item?._id ? 'var(--dark-active-border-color, #329592)' : 'var(--common-border-color)',
                      cursor: 'pointer',
                      transition: '.3s'
                    }}
                    p={2}
                    onClick={() => {
                      setSelected(item);
                    }}
                  >
                    <Grid container alignItems={'center'} spacing={1}>
                      <Grid item>
                        <PersonIcon />
                      </Grid>
                      <Grid item>
                        <Typography>{item?.user?.optionLabel}</Typography>
                      </Grid>
                      <Grid item>
                        <Chip color="primary" label={item?.type} />
                      </Grid>
                      <Grid item>
                        <Chip color="primary" label={item?.status} />
                      </Grid>
                      <Grid item>
                        {item?.status === 'Send' && (
                          <HtmlTooltip title="Delete">
                            <IconButton
                              aria-label="Delete"
                              size="small"
                              onClick={() => {
                                handleDelete(item?._id);
                              }}
                            >
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </HtmlTooltip>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              ))
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Grid>
        </Grid>
        <Grid item xs={12} sm={7} md={8} lg={9}>
          {selected && (
            <Box
              p={2}
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--common-border-color)',
                marginTop: '47px'
              }}
            >
              {selected?.logs?.map((item, index) => (
                <Box key={index}>
                  {index !== 0 && (
                    <>
                      <br />
                      <div style={{ height: '1px', width: '100%', background: 'var(--common-border-color)' }} />
                      <br />
                    </>
                  )}

                  <Typography variant="body1" style={{ fontWeight: '600', color: 'var(--dark-primary-text, #3e3e3e)' }}>
                    {item?.detail}
                  </Typography>
                  <Typography variant="body2" style={{ fontSize: '12px', marginBottom: '6px', color: 'var(--dark-secondary-text, gray)' }}>
                    {moment(item?.date).format('MMM DD YYYY hh:mm A')}
                  </Typography>
                  {item?.reason && (
                    <Typography variant="body2" style={{ color: 'var(--dark-secondary-text, #3e3e3e)' }}>
                      {item?.reason}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
      {openDialog && <AssignUserDialog handleClose={() => setOpenDialog(false)} onSuccess={() => fetchData()} id={irtTicketData?._id} />}
    </Box>
  );
};

export default Approver;
