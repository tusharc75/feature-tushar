import { Box, Button, Chip, Grid, IconButton, Tooltip, Typography, useMediaQuery } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import PersonIcon from '@material-ui/icons/Person';
import AssignUserDialog from './AssignUserDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import moment from 'moment';


const Approver = ({ irtTicketData }) => {
  const [approver, setAapprover] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [selected, setSelected] = useState(null);

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
        fetchData()
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Deleted Successfully'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

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
                      backgroundColor: 'white',
                      borderColor: selected?._id === item?._id ? '#329592' : 'rgb(224, 224, 224)',
                      cursor: 'pointer',
                      transition: '.3s'
                    }}
                    p={2}
                    onClick={() => {
                      setSelected(item)
                    }}
                  >
                    <Box display="flex">
                      <Box>
                        <PersonIcon />
                      </Box>
                      <Box ml={2}>
                        <Typography>{item?.user?.optionLabel}</Typography>
                      </Box>
                      <Box ml={2}>
                        <Chip color="primary" label={item?.type} />
                      </Box>
                      <Box ml={2} flexGrow={1}>
                        <Chip color="primary" label={item?.status} />
                      </Box>
                      <Box ml={2} >
                        {item?.status === "Send" &&
                          <Tooltip title="Delete">
                            <IconButton
                              aria-label="Delete"
                              size="small"
                              onClick={() => {
                                handleDelete(item?._id)
                              }}
                            >
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        }
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))
            ) : (
              <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Grid>
        </Grid>
        <Grid item xs={12} sm={7} md={8} lg={9}>
          {selected &&
            <Box
              p={2}
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgb(224, 224, 224)',
              }}>
              {selected?.logs?.map((item, index) => (
                <Box key={index}>
                  <Typography variant="body1">{item?.detail}</Typography>
                  <Typography variant="body2">{moment(item?.date).format('MMM DD YYYY hh:mm A')}</Typography>
                  {item?.reason && <Typography variant="body2">{item?.reason}</Typography>}
                  <br />
                  <hr />
                  <br />
                </Box>
              ))}
            </Box>}
        </Grid>
      </Grid>
      {openDialog && <AssignUserDialog handleClose={() => setOpenDialog(false)} onSuccess={() => fetchData()} id={irtTicketData?._id} />}
    </Box>
  );
};

export default Approver;
