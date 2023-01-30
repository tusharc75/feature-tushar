import { Box, Button, Chip, Grid, IconButton, Typography, useMediaQuery } from '@material-ui/core';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import PersonIcon from '@material-ui/icons/Person';

const Approver = ({ irtTicketData }) => {

    const [approver, setAapprover] = useState(null);

    useEffect(() => {
        fetchData()
    }, []);

    const fetchData = () => {
        axiosInstance().get(`${routes?.irtTicket?.path}/approver/${irtTicketData?._id}`).then(({ data: { data } }) => {
            setAapprover(data)
        })
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
                        {approver ? (
                            approver?.map((item, index) => (
                                <Grid item xs={12} key={index}>
                                    <Box
                                        style={{
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                            backgroundColor: 'white',
                                            borderColor: 'rgb(224, 224, 224)',
                                            cursor: 'pointer',
                                            transition: '.3s'
                                        }}
                                        p={2}
                                        onClick={() => { }}
                                    >
                                        <Box display="flex" flexDirection="row">
                                            <Box >
                                               <PersonIcon/>
                                            </Box>
                                            <Box ml={2}>
                                                <Typography>{item?.user?.optionLabel}</Typography>
                                            </Box>
                                            <Box ml={2}>
                                                <Chip color="primary" label={item?.status} />
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
                    <Box textAlign="center">

                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Approver;
