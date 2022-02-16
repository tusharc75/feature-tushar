import React, { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Typography, Paper } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CreateZone from './CreateZone';
import DeleteButton from "../../components/Helpers/DeleteButton";
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

const ZoneDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions },
  }: any = useData();
  const [activeTable, setActiveTable] = useState('Details');
  const [tabValue, setTabValue] = useState(0);
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [productCategoryData, setProductCategoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [productCategoryFields, setCategoryFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productCategoryResource, setProductCategoryResource] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    routes.address,
  ]);

  useEffect(() => {
    if (id) {
      getZoneFields();
      fetchZoneData();

    }
  }, [id]);

  const fetchZoneData = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/zone/${id}`);
      handleMainPoints(data);
      setHeadingLbl(data.name);
      setProductCategoryData(data);
      setProductCategoryResource({ id: data._id });
      setCustomizedRoutes([routes.zone, { title: data.name }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data?.name}`,
      taxJurisdiction: data.taxJurisdiction || "",
    };
    setMainPoints(tempMp);
  };

  const getZoneFields = () => {
    axiosInstance()
      .get("/field?resource=Zone")
      .then(({ data }) => {

        setCategoryFields(data.data?.filter((field) => field.isRead))

      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteZone = () => {
    if (id) {
      if (permissions?.address?.isDelete) {
        axiosInstance()
          .put(`/zone/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            history.goBack();
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      setActiveTable('Pincode');
    }
  };

  return (
    <>
      {openUpdateDialog && (
        <CreateZone
          open={openUpdateDialog}
          onClose={closeUpdateDialog}
          // fetchData={() => {
          //   fetchZoneData();
          // }}
          zoneId={id}
          isUpdateDisabled = {false}
          isClone={false}
          onSuccess={() => {
            fetchZoneData();
            closeUpdateDialog();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes.zone.title.toLowerCase()} ${headingLbl}?`}
          onClose={() => {
            setShowConfirmBox(false)
          }}
          onOk={handleDeleteZone}
        />
      )}
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>
              {!productCategoryData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                    <Box marginX={1} />
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                  </Box>
                </div>
              ) : (

                <DetailsPageHeader
                  heading={headingLbl}
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {permissions?.address?.isUpdate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  )}
                  <Box component="span" marginX={1} />
                  {permissions?.address?.isDelete && (
                    <span
                      title={
                        id
                          ? "Primarily selected address can't be deleted"
                          : "Permanently delete this address"
                      }
                    >
                      <DeleteButton
                        text="Delete"
                        onClick={() => setShowConfirmBox(true)}
                      />
                    </span>
                  )}
                </DetailsPageHeader>
              )}

              <Tabs
                className="oms-tab"
                value={tabValue}
                onChange={handleMainTabChange}
                indicatorColor="primary"
                textColor="primary"
                aria-label="icon tabs example"
                TabIndicatorProps={{
                  style: {
                    height: 0
                  }
                }}
              >
                <Tab label="Details" aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
                <Tab label="Pincode" aria-controls="a11y-tabpanel-1" id="a11y-tab-1" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
              <Box>
                {loading || !productCategoryFields.length ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <DetailsPage data={productCategoryData} fields={productCategoryFields} />
                )}
              </Box>
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <Box><p>Pincode</p></Box>
                    </TabPanel>
            </Paper>
          </Grid>
        </Grid>

      </Fragment>

    </>
  );
};

export default ZoneDetailPage;
