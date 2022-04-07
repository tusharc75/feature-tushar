import { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Paper } from "@material-ui/core";
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
import { repairType } from "../../constants/helpers";
import ManageRepairType from "./ManageRepairType";
import { BiEdit } from "react-icons/bi";
import { isMobile, isTablet } from "react-device-detect";
import accountClass from "../Account/account.module.scss";
import DeleteButton from '../../components/Helpers/DeleteButton';


const RepairTypeDetailsPage = () => {

    const toastConfig = useContext(CustomToastContext);
    const { id } = useParams();
    const history = useHistory();
    const { state: { user, permissions } }: any = useData();

    const [repairTypeData, setRepairTypeData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [fields, setFields] = useState([]);

    useEffect(() => {
        fetchFields();
        fetchData();
    }, [id]);

    const fetchFields = () => {
        axiosInstance().get(`/field?resource=${repairType.resource}`)
            .then(({ data }) => {
                setFields(data.data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const fetchData = async () => {
        axiosInstance().get(`${repairType.api}/${id}`)
            .then(({ data: { data } }) => {
                setRepairTypeData(data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const handleDelete = () => {
        axiosInstance().put(`${repairType.api}/remove`, { "ids": [id] }).then(() => {
            setShowConfirmBox(false);
            history.goBack();
        }).catch((error) => {
            toastConfig.setToastConfig(error)
            setShowConfirmBox(false);
        });
    }

    return (<Fragment>
        <Grid container className="headerbox">
            <CustomBreadCrumbs routes={[routes.repairType, { title: repairTypeData?.repairType }]} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
            <Grid item xs={12} sm={12} md={8} lg={8}>
                <Paper style={{ height: "650px" }}>
                    <DetailsPageHeader
                        heading={repairTypeData?.repairType}
                        mainPoints={null}
                        showHeading={true}
                    >
                        {permissions?.repairType?.isUpdate && (
                            <Button
                                variant={isMobile && !isTablet ? "text" : "contained"}
                                color="primary"
                                size="small"
                                onClick={() => { setOpenUpdateDialog(true); }}
                                className={isMobile && !isTablet ? accountClass.mobile_button_layout : ""}
                                style={isMobile && !isTablet ? { color: "#43aeaa" } : {}}
                            >
                                {isMobile && !isTablet ? <BiEdit size={20} /> : "Edit"}
                            </Button>

                        )}
                        {permissions?.repairType?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
                    </DetailsPageHeader>
                    <Box> {repairTypeData && fields.length ? (
                        <DetailsPage data={repairTypeData} fields={fields} />
                    ) : (
                        <Grid container spacing={2} style={{ padding: "8px" }}>
                            <CommonSkeleton lenArray={[...Array(7).keys()]} />
                        </Grid>
                    )}
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} sm={12} md={4} lg={4}>

            </Grid>
        </Grid>
        {showConfirmBox && (
            <ConfirmationDialog
                open={showConfirmBox}
                message={`Are you sure you want to delete this ${routes.repairType?.title} ?`
                }
                onClose={() => {
                    setShowConfirmBox(false);
                }}
                onOk={handleDelete}
            />
        )}
        {openUpdateDialog &&
            <ManageRepairType
                isClone={false}
                repairTypeId={id}
                onClose={() => setOpenUpdateDialog(false)}
                onSuccess={() => {
                    setOpenUpdateDialog(false);
                    fetchData()
                }}
            />
        }
    </Fragment>
    );
};

export default RepairTypeDetailsPage;
