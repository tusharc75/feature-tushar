import { Box, Button, CircularProgress, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, Typography } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { makeStyles } from '@material-ui/styles';
import { DndProvider } from 'react-dnd';
import { isMobile, isTablet } from 'react-device-detect';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import DragBox from './DragBox';
import axiosInstance from 'src/axios/axiosInstance';
import DropBox from './DropBox';
import update from 'immutability-helper';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const useClasses = makeStyles(() => ({
  root: {
    height: 'calc(80vh + 20px)'
  },
  gridBox_layout: {
    height: 'calc(85vh-194px)',
    overflow: 'auto',
  },
  column: {
    flexDirection: 'row'
  },
  screenHeightAuto: {
    height: 'calc(100vh - 200px)',
    overflow: 'auto'
  },
}));

const fields = [
  {
    name: 'image',
    label: 'Image',
  },
  {
    name: 'imageSlider',
    label: 'Image Slider',
  },
  {
    name: 'productCategory  ',
    label: 'Product Category  ',
  },
  {
    name: 'productList',
    label: 'Product List',
  },
  {
    name: 'menu',
    label: 'Menu',
  },
];

const EcommerceHome = () => {
  const classes = useClasses();
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oldData, setOldData] = useState([]);
  const [column] = useState("12");
  const toastConfig = useContext(CustomToastContext);

  const fetchData = async () => {
    try {
      setLoading(true);
      let res = await axiosInstance().get('/e-commerce-home');
      let data = res.data?.data;
      setFormData(data?.items || []);
      setOldData(data?.items || []);
      setLoading(false);
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const handleClickSave = async () => {
    try {
      setIsSubmitting(true);
      let body = {
        items: formData
      };
      await axiosInstance().put('/e-commerce-home', body);
      setIsSubmitting(false);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Record updated successfully'
      });
      fetchData();
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const handleRemove = (id: string) => {
    setFormData((prevState) => prevState.filter((i) => (i._id ? i._id !== id : i.name !== id)));
  };

  const findCard = React.useCallback(
    (id: string) => {
      const card = formData.find((c) => (c?._id ? c?._id === id : c?.name === id));
      return {
        card,
        index: formData.indexOf(card)
      };
    },
    [formData]
  );

  const moveCard = React.useCallback(
    (id: string, atIndex: number) => {
      const { card, index } = findCard(id);
      setFormData(
        update(formData, {
          $splice: [
            [index, 1],
            [atIndex, 0, card]
          ]
        })
      );
    },
    [findCard, formData, setFormData]
  );

  const handleImport = () => { };
  const handleExportField = () => { };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="headerbox">
        <Grid container justifyContent="space-between">
          <Grid item xs={6}>
            <CustomBreadCrumbs routes={[{ title: routes?.eCommerceHome?.title }]} />
          </Grid>
          <Grid item xs={6}>
            <Box display="flex" justifyContent="flex-end">
              <Box mr={2}>
                <Typography className="link cursor-pointer" style={{ color: 'var(--tertiary-light)' }} onClick={handleExportField}>
                  Export
                </Typography>
              </Box>
              <Box mr={1}>
                <input accept="json" style={{ display: 'none' }} onChange={handleImport} id="import-file" multiple={false} type="file" />
                <label htmlFor="import-file">
                  <Typography className="cursor-pointer" style={{ color: 'var(--tertiary-light)' }}>
                    Import
                  </Typography>
                </label>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </div>
      <div className="detail-container">
        <Box bgcolor={'white'} p={1.2} display="flex" justifyContent="flex-end">
          <Box py={'6px'}>
            <Button
              color="primary"
              variant="contained"
              size="small"
              disableRipple
              disabled={isSubmitting || loading || oldData === formData}
              onClick={handleClickSave}
              startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
            >
              Save
            </Button>
          </Box>
        </Box>
        <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
          <Box bgcolor="#f5f5f5" p={1}>
            <Grid container spacing={2} >
              <Grid item xs={12} md={3} sm={4}>
                <Box bgcolor="white" p={3} style={{ height: '80vh' }}>
                  <Grid container spacing={1}>
                    {fields?.map((i, index) => (
                      <DragBox key={index} name={i.name} label={i.label}  column={column} formData={formData} setFormData={setFormData} />
                    ))}
                  </Grid>
                </Box>
              </Grid>
              <Grid item xs={12} md={9} sm={8}>
                {loading ? (
                  <Box height="100%" width="100%" display="flex" justifyContent="center" alignItems="center">
                    <CircularProgress size={30} color="inherit" />
                  </Box>
                ) : (
                  <Box border={1} p={2} bgcolor="grey.100" borderColor="grey.300" className={classes.screenHeightAuto} >
                    <DropBox 
                    formData={formData} 
                    setFormData={setFormData} 
                    handleRemove={handleRemove} 
                    findCard={findCard} 
                    moveCard={moveCard}
                     />
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </DndProvider>
      </div>
    </div>
  );
};

export default EcommerceHome;
