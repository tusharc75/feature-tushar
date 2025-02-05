import React from 'react';
import {
  Typography,
  Box,
  Avatar,
  Grid,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { useEffect, useState } from 'react';

interface TechniciansStatusCountDialogProps {
  open: boolean;
  onClose: () => void;
}

const TechniciansStatusCountDialog: React.FC<TechniciansStatusCountDialogProps> = ({
  open,
  onClose,
}) => {

  const [techniciansData, setTechniciansData] = useState([]);
  useEffect(() => {
    const fetchUserStatusCounts = async () => {
      try {
        const response = await axiosInstance().get('/work-order/work-order-planning/technician-status-counts');
        const responseData = response.data?.data || {};

        const transformedData = Object.keys(responseData).map((key) => ({
          userId: responseData[key].userId,
          userName: responseData[key].userName,
          statuses: responseData[key].statuses,
        }));

        setTechniciansData(transformedData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserStatusCounts();
  }, []);

  return (
    <Dialog open={true} fullWidth>
      <CustomDialogHeader
        onClose={() => {
          onClose();
        }}
        title={`Technician`}
      />
      <CustomDialogContent>
          {techniciansData.map((technician) => (
            <Grid
              item
              key={technician.userId}
              style={{
                border: '1px solid #e0e0e0',
                padding: '10px',
                marginBottom: '10px',
              }}
              borderRadius='10px'
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar>{technician.userName.charAt(0)}</Avatar>
                <Typography variant="h6">{technician.userName}</Typography>
              </Box>

              <Box
                display="flex"
                flexWrap="wrap"
                gap={1}
                marginTop="10px"
                paddingLeft="48px"
              >
                {Object.entries(technician.statuses).map(([status, count]) => (
                  <Typography
                    key={status}
                    variant="body2"
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                  >
                    {`${status}: ${count}`}
                  </Typography>
                ))}
              </Box>
            </Grid>
          ))}
      </CustomDialogContent>
    </Dialog>
  );
};

export default TechniciansStatusCountDialog;