import { Box, Button, Container, Grid, TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DetailsPage from '../../../components/Shared/DetailsPage';

const IrtTicket = ({ openAuthId, openAuthData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [irtTicketData, setIrtTicketData] = useState(null);
  const [fields, setFields] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmited, setIsSubmited] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [openAuthId]);

  const fetchData = () => {
    axiosInstance()
      .get(`${routes.irtTicket.path}/approver/public/${openAuthId}`)
      .then(({ data: { data } }) => {
        setIrtTicketData(data?.irtTicket);
        setFields(data?.fields);
        let userOptions = data?.fields?.filter((i) => i.fieldData?.fieldName === 'owner');
        setUserList(userOptions[0]?.fieldData?.option);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const submitResponce = (status) => {
    const data = {
      user: openAuthData?.user,
      status: status,
      comment: comment,
      openAuthId: openAuthId
    };
    axiosInstance()
      .post(`${routes.irtTicket.path}/approver/public/response/${irtTicketData?._id}`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Your response has been submitted successfully.`
        });
        setIsSubmited(true);
        setComment('')
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleForwardApproval = () => {
    let users = selectedUsers.map((i)=>i.optionValue);
    const data = {
      openAuthId:openAuthId,
      users: users
    }
    axiosInstance()
    .post(`${routes.irtTicket.path}/approver/public/forwardApprover/${irtTicketData?._id}`, data)
    .then(({ data }) => {
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Your response has been submitted successfully.`
      });
    })
    .catch((err) => {
      toastConfig.setToastConfig(err);
    });
  }

  return (
    <>
      <>
        {fields && fields?.length && irtTicketData ? (
          <Container>
            <Box pt={3} sx={{height:'100vh'}}>
              {!isSubmited && <DetailsPage data={irtTicketData} fields={fields} />}
              {isSubmited && (
                <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'center', color: '#047d1c' }} title={' Thanks for your submission'}>
                  Thanks for your submission
                </h1>
              )}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box my={3} p={4}>
                    <Typography variant="h6" color="primary">
                      Approve / Reject
                    </Typography>
                    <Box my={1}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Comment"
                        multiline
                        rows={3}
                        margin="dense"
                        value={comment}
                        onChange={(e: any) => setComment(e.target.value)}
                      />
                    </Box>
                    <Box pt={2} style={{ display: 'flex', gap: '15px' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={isSubmited}
                        onClick={() => {
                          submitResponce('Approved');
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={isSubmited}
                        onClick={() => {
                          submitResponce('Rejected');
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box my={3} p={4}>
                    <Typography variant="h6" color="primary">
                      Forward Approval
                    </Typography>
                    <Box pt={2}>
                      <Autocomplete
                        size="small"
                        options={userList}
                        multiple
                        value={selectedUsers}
                        onChange={(_, val) => {
                          setSelectedUsers(val);
                        }}
                        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                        getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                        renderInput={(props) => <TextField {...props} placeholder={''} variant="outlined" name="userList" label={'Select Users'} />}
                      />
                    </Box>
                    <Box my={3}>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={!isSubmited && selectedUsers?.length === 0}
                        onClick={() => {
                          handleForwardApproval()
                        }}
                      >
                        Forward Approval
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Container>
        ) : null}
      </>
    </>
  );
};

export default IrtTicket;
