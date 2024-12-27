import { useState, useEffect, useContext } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import BoxWithBorder from '../../../components/BoxWithBorder';
import { Skeleton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const CostDetails = ({ product, productData, minHeight = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [listPrice, setListPrice] = useState(0);
  const [costList, setCostList] = useState(null);

  useEffect(() => {
    if (productData?.listPrice) {
      setListPrice(productData?.listPrice);
    }
  }, [product, productData]);

  useEffect(() => {
    fetchData();
  }, [product, productData]);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`product/${product}/cost`)
      .then(async ({ data: { data } }) => {
        setCostList(data);
        setLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  return (
    <Box className={`single-form-v1`}>
      <Box className={'form-head-v1'} justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">Cost Details</Typography>
        <HtmlTooltip title="Refresh Cost Details">
          <IconButton size="small" onClick={fetchData}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </Box>
      <Box className="formdata-v1" style={{ minHeight }}>
        {!loading ? (
          <Box>
            {costList?.map((data) =>
              data?.warehouse === 'All' || data?.totalQty ? (
                <Accordion defaultExpanded={data?.warehouse === 'All' ? true : false}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                    <Typography variant="subtitle2">
                      {data?.warehouse === 'All' ? `${data?.warehouse} ${resources?.warehouse?.titleSingular}` : data?.warehouse}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box style={{ width: '100%' }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography className="table-head-v1">Customer Price</Typography>
                        <Typography className="table-data-v1" style={{ borderTopWidth: '1px' }}>
                          {listPrice}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography className="table-head-v1 bt-0 br-0">Average Cost</Typography>
                        <Typography className="table-data-v1  bt-0">{data?.price}</Typography>
                      </Box>
                      <Box mb={1} display="flex" justifyContent="space-between">
                        <Typography className="table-head-v1 bt-0 br-0">Margin(%)</Typography>
                        <Typography className="table-data-v1  bt-0">
                          {listPrice === 0 ? 0 : ((listPrice + data?.price) / listPrice).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ) : null
            )}
          </Box>
        ) : (
          [1, 2].map((i) => (
            <BoxWithBorder
              key={i}
              style={{
                margin: '8px'
              }}
            >
              <Box padding={1}>
                <Skeleton variant="text" width="100px" height="20px" />
                <Box marginTop={1} />
                <Skeleton variant="text" width="100%" height="15px" />
              </Box>
            </BoxWithBorder>
          ))
        )}
      </Box>
    </Box>
  );
};

export default CostDetails;
