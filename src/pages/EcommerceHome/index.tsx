import { Box, Button, CircularProgress, Grid, Typography } from '@material-ui/core';
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
import { ECOM_SECTIONS } from 'src/constants/helpers';

const useClasses = makeStyles(() => ({
  root: {
    height: 'calc(80vh + 20px)'
  },
  gridBox_layout: {
    height: 'calc(85vh-194px)',
    overflow: 'auto'
  },
  column: {
    flexDirection: 'row'
  },
  screenHeightAuto: {
    height: 'calc(100vh - 200px)',
    overflow: 'auto'
  }
}));

const EcommerceHome = () => {

  const classes = useClasses();
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance().get('/e-commerce-home')
      .then(({ data: { data } }) => {
        let items = data?.items?.sort((a, b) => a.order - b.order);
        setFormData(items || []);
        setLoading(false);
      }).catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleClickSave = () => {
    setIsSubmitting(true);
    let body = {
      items: formData?.map((i, idx) => {
        return {
          ...i,
          order: idx + 1
        };
      }) || []
    };
    axiosInstance().put('/e-commerce-home', body).then(({ data }) => {
      setIsSubmitting(false);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
      fetchData();

    }).catch((err) => {
      toastConfig.setToastConfig(err);
    });



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

  const handleImport = (event) => {
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({
        hideDuration: null,
        open: true,
        type: 'info',
        message: `Uploading file, Please wait...`
      });
      const file_to_read = event.target.files[0];
      const fileread = new FileReader();
      fileread.onload = function (e) {
        const content: any = e.target.result;
        const data = JSON.parse(content);
        setFormData(data);
      };
      fileread.readAsText(file_to_read);
      event.target.files = null;
      event.target.value = '';
    }
  };

  const handleExportField = () => {
    toastConfig.setToastConfig({
      hideDuration: null,
      open: true,
      type: 'info',
      message: `Your file will be downloaded/uploaded in a matter of seconds`
    });
    const url = window.URL.createObjectURL(new Blob([JSON.stringify(formData) || '']));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `page_structure.json`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes?.eCommerceHome?.title }]} />
        </Box>
        <Box className="controls-v1">
          <Box sx={{ display: 'flex' }}>
            <label className={`new-headerbox-button-v1`} onClick={handleExportField} style={{ cursor: 'pointer' }}>
              Export
            </label>
            <input
              onClick={(e: any) => (e.target.value = null)}
              accept="application/json"
              style={{
                opacity: '0',
                position: 'absolute',
                zIndex: -1
              }}
              onChange={handleImport}
              id="import-file"
              multiple={false}
              type="file"
            />
            <label htmlFor="import-file" className={`new-headerbox-button-v1`} style={{ marginRight: '18px', cursor: 'pointer' }}>
              Import
            </label>

            <Button
              color="primary"
              variant="contained"
              size="small"
              disabled={isSubmitting || loading}
              onClick={handleClickSave}
              startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={5} md={4} lg={3}>
              <Box
                bgcolor="var(--dark-secondary, #f5f5f5)"
                p={3}
                style={{ maxHeight: 'calc(100vh - 200px)', height: '100%', overflow: 'auto' }}
                border={'1px solid var(--common-border-color)'}
              >
                <Grid container spacing={1}>
                  {ECOM_SECTIONS?.map((i, index) => (
                    <DragBox key={index} type={i.type} label={i.label} setFormData={setFormData} />
                  ))}
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12} sm={7} md={8} lg={9}>
              {loading ? (
                <Box height="100%" width="100%" display="flex" justifyContent="center" alignItems="center">
                  <CircularProgress size={30} color="inherit" />
                </Box>
              ) : (
                <Box
                  border={1}
                  p={2}
                  bgcolor="var(--dark-secondary, #f5f5f5)"
                  borderColor="var(--common-border-color)"
                  className={classes.screenHeightAuto}
                >
                  <DropBox formData={formData} setFormData={setFormData} handleRemove={handleRemove} findCard={findCard} moveCard={moveCard} />
                </Box>
              )}
            </Grid>
          </Grid>
        </DndProvider>
      </Box>
    </Box>
  );
};

export default EcommerceHome;
