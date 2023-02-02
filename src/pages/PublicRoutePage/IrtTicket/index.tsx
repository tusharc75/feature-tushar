import { Box, Button, Container, FormControl, FormControlLabel, Grid, Paper, Radio, TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import RadioGroup from '@material-ui/core/RadioGroup';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DetailsPage from '../../../components/Shared/DetailsPage';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { IRT_APPROVER_STATUS } from 'src/constants/helpers';

const resaonList = [
  "Inventory physically not here to release.  Action:  Complete paperwork and cycle count to correct inventory accuracy. ",
  "Future demands not reflected in system and need to keep inventory for future known demands.  Action:  Update planning data (ie. forecast, sales orders, safety stock, min/max, MOQ, etc).    ",
  "Part expired and not available.  Action:  Will scrap physically and electronically.",
  "Part is not the same part.  The description is not the same. Action:  Do we need to add to master supersession list? ",
  "Freight is too much (> 25%).  What is considered acceptable landed costs for your business? ",
  "Want to keep for potential future demand.  (I don’t like this option BUT we may want to consider it as realistic and deep dive later.)",
  "Other"
]

const IrtTicket = ({ openAuthId, openAuthData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [irtTicketData, setIrtTicketData] = useState(null);
  const [fields, setFields] = useState(null);
  const [isSubmited, setIsSubmited] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('Approved');
  const [reason, setReason] = useState('');


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

  const submitResponce = () => {
    const data: any = {
      openAuthId: openAuthId,
      status: status,
      comment: comment,
    };
    if (status === IRT_APPROVER_STATUS.declined) {
      data.reason = reason;
    }
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
    let users = selectedUsers.map((i) => i.optionValue);
    const data = {
      openAuthId: openAuthId,
      users: users
    }
    axiosInstance()
      .post(`${routes.irtTicket.path}/approver/public/forwardApprover/${irtTicketData?._id}`, data)
      .then(({ data }) => {
        setSelectedUsers([])
        setIsSubmited(true);
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
    <> {fields && fields?.length && irtTicketData ? (
      <Container>
        {!isSubmited ?
          <Box pt={3} >
            <DetailsPage data={irtTicketData} fields={fields} />
            <Box pt={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper>
                    <Box p={3}>
                      <Typography variant="h6" color="primary">Approve/Decline IRT</Typography>
                      <Box mt={2}>
                        <RadioGroup
                          aria-label="quiz"
                          value={status}
                          name="status"
                          row
                          onChange={(event) => {
                            setStatus(event.target.value);
                          }}>
                          <FormControlLabel value={IRT_APPROVER_STATUS.approved} control={<Radio />} label="Approve" />
                          <FormControlLabel value={IRT_APPROVER_STATUS.declined} control={<Radio />} label="Decline" />
                        </RadioGroup>
                      </Box>
                      {status === IRT_APPROVER_STATUS.declined &&
                        <Box mt={2}>
                          <FormControl variant="outlined" fullWidth margin="dense">
                            <Autocomplete
                              id="tags-filled"
                              options={resaonList}
                              getOptionLabel={(option) => option}
                              value={reason}
                              onChange={(e, value) => {
                                setReason(value);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  margin="dense"
                                  variant="outlined"
                                  label="Decline Reason"
                                  placeholder="Decline Reason"
                                  name="reason"
                                />
                              )}
                            />
                          </FormControl>
                        </Box>
                      }
                      <Box my={1}>
                        <TextField
                          variant="outlined"
                          type="text"
                          label="Comment"
                          multiline
                          fullWidth
                          rows={2}
                          margin="dense"
                          value={comment}
                          onChange={(e: any) => setComment(e.target.value)}
                        />
                      </Box>
                      <Box pt={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          disabled={isSubmited}
                          onClick={() => {
                            submitResponce();
                          }}
                        >
                          Submit
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper>
                    <Box p={3}>
                      <Typography variant="h6" color="primary"> Forward Approval  </Typography>
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
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box> :
          <Box pt={3} >
            <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'center', color: '#047d1c' }} title={' Thanks for your submission'}>
              Thanks for your submission
            </h1>
          </Box>}
      </Container>
    ) : <Box p={2} bgcolor="white">
      <CommonSkeleton lenArray={[...Array(10).keys()]} />
    </Box>}
    </>
  );
};

export default IrtTicket;
