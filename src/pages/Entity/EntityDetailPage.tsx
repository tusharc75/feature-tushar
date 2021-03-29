import React, { useState, useEffect, useContext } from "react";
import {
    Box,
    Button,
    Grid,
    Typography
} from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import Container from '../../components/Container'
import Layout from "../../components/Layout";
import { Skeleton } from "@material-ui/lab";
import DetailsPageHeader from '../../components/DetailsPageHeader'
import { Link } from "react-router-dom";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { useData } from '../../StateProvider/Provider';
import { entityPage } from '../../routes/Entities'
import { capitalize } from '../../services/util'
import DetailsPage from '../../components/Shared/DetailsPage'
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import routes from '../../components/Helpers/Routes';
import axiosInstance from './../../axios/axiosInstance'
import Activity from "../../components/Activity";
import { isObjectEmpty } from './../../constants/helpers'
import DeleteButton from "../../components/Helpers/DeleteButton";
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const Roles = () => {
    const toastConfig = useContext(CustomToastContext);
    
    const history = useHistory();
    const { state: { user } }: any = useData();
    const [headingLbl, setHeadingLbl] = useState('')
    const [entityData, setEntityData] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [entityFields, setEntityFields] = useState([])
    const [mainPoints, setMainPoints] = useState({})
    const [isUpdating, setUpdating] = useState(false);
    const [allowedToEdit, setAllowedToEdit] = useState(false)
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [entityPermissions, setEntityPermissions] = useState({ isCreate: false, isUpdate: false, isRead: false, isDelete: false });
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [canEdit, setCanEdit] = useState(false)
    let { id } = useParams();

    useEffect(() => {
        if (id) {
            fetchEntityData()
        }
    }, [id]);

    useEffect(() => {
        const data = user.role?.sideBar;

        if (data) {
            const hasEntityPermission = data.find(d => d.name == "Entity");
            if (hasEntityPermission) {
                setEntityPermissions({
                    isCreate: hasEntityPermission.isCreate,
                    isUpdate: hasEntityPermission.isUpdate,
                    isRead: hasEntityPermission.isRead,
                    isDelete: hasEntityPermission.isDelete
                });
            }
        }
    }, [user]);

    const fetchEntityData = async () => {
        setLoading(true)
        axiosInstance().get(`/entity/${id}`).then(({ data: { data } }) => {

            handleMainPoints(data)

            let name = capitalize(data.entityName || '') 
            if (data?.salutation?.optionLabel) {
                name = data.salutation.optionLabel + name
            }

            setHeadingLbl(name)
            handleAllowToEditList(data)
            setEntityData(data)
            getEntityFields()

            setCanEdit([...data?.collaborator, data?.owner].some(obj => obj.optionValue === user.user._id))

            setCustomizedRoutes([routes.entity, { title: `${data.entityName} ` }]);
        }).catch(err => {
            setLoading(false)
        })
    }

    const handleMainPoints = (data) => {
        let tempMp = {
            phone: data.phone || '',
            email: data.email || '',
            title: data.title || '',
        }
        if (data?.accountName?.optionLabel) {
            tempMp["Account Name"] = data.accountName.optionLabel
        }
        console.log("🚀 ~ file: EntityDetailPage.js ~ line 96 ~ handleMainPoints ~ tempMp", tempMp)
        setMainPoints(tempMp)
    }

    const getEntityFields = () => {
        axiosInstance().get('/field?resource=Entity').then(({ data: { data } }) => {
            setEntityFields(data.filter(d => d.isUpdate || d.isRead))
            setLoading(false)
        });
    };

    const quickLinks = [
        {
            label: "Account Heirarchy",
            count: 0
        },
        {
            label: "Projects",
            count: 0
        },
        {
            label: "Opportunity",
            count: 0
        },
        {
            label: "Quotes",
            count: 0
        },
        {
            label: "Accounts Teams",
            count: 0
        },
        {
            label: "Contacts",
            count: 0
        },
    ]

    const handleDeleteEntity = () => {
        if (entityData?._id) {

            axiosInstance().put(`/entity/remove`, { ids: [entityData._id] }).then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                goBackToListing()
                setShowConfirmBox(false)
            }).catch(error => {
                toastConfig.setToastConfig(error);
                setShowConfirmBox(false)
            })
        }
        else {
            setShowConfirmBox(false)
        }
    }
    const goBackToListing = () => {
        history.push({
            pathname: entityPage.path
        });
    }

    const handleAllowToEditList = (entityDetails) => {
        const userId = user?.user?._id;
        let allowToEdit = false;

        if (userId) {
            allowToEdit = (entityDetails.owner?.optionValue && entityDetails.owner.optionValue == userId)

            if (!allowToEdit && entityDetails.collaborator && entityDetails.collaborator.length > 0) {
                allowToEdit = entityDetails.collaborator.findIndex(d => d.optionValue == userId) > -1;
            }

            if (allowToEdit)
                setAllowedToEdit(allowToEdit);
        }
    }

    const handleOpneUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const closeUpdateDialog = () => {
        setOpenUpdateDialog(false);
    };

    const handleUpdateEntity = (values) => {
        setUpdating(true);
        if (values.employees) {
            values.employees = parseInt(values.employees)
        }
        const updatedData = {
            ...values,
            _id: entityData._id,
        };

        axiosInstance().put('/entity', updatedData).then(({ data }) => {
            fetchEntityData()
            toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
            setUpdating(false);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            setUpdating(false);
        });
    };
    return (
        <>
            <Layout>
                {openUpdateDialog && (
                    <UpdateDetailsDialog
                        title={`Editing  ${entityData.firstName}`}
                        openDialog={openUpdateDialog}
                        onClose={closeUpdateDialog}
                        data={entityData}
                        fields={entityFields}
                        isUpdating={isUpdating}
                        handleUpdate={handleUpdateEntity}
                    />
                )}
                <Grid container direction="row">
                    <Grid item xs={12} className="pl-2">
                        <CustomBreadCrumbs routes={customizedRoutes} />
                    </Grid>
                </Grid>

                <div>
                    <DetailsPageHeader
                        heading={headingLbl}
                        logo={entityData?.entityLogo ? entityData.entityLogo : undefined}
                        mainPoints={mainPoints}
                        // style={{ marginTop: "150px", minHeight: "200px" }}
                        showHeading={true}
                    >
                       {
                                entityPermissions.isUpdate && canEdit ?
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleOpneUpdateDialog}
                                    >
                                        Edit
                                    </Button> : null
                            }

                            <Box component="span" marginX={1} />
                            {
                                entityPermissions.isDelete && entityData?.owner?.optionValue && user?.user?._id &&
                                    entityData.owner.optionValue === user.user._id ?
                                    <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                                    : null
                            }

                    </DetailsPageHeader>

                    <div className="detailPageContainer">
                        <Container>
                            <Grid container spacing={3}>
                                <Grid item sm={8} md={8} lg={8}>
                                    <div className="detailPageDiv1"
                                    // style={{ pointerEvents: allowedToEdit ? "" : "none" }}
                                    >
                                        {
                                            loading ?
                                                <Grid container spacing={2}>
                                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                                        <Grid item sm={6} md={6}>
                                                            <Skeleton variant="text" width="100px" height="16px" />
                                                            <Box marginY={1} />
                                                            <Skeleton width="100%" height="50px" />
                                                        </Grid>
                                                    ))}
                                                </Grid> :
                                                <DetailsPage data={entityData} fields={entityFields} />

                                            // <DetailsPage
                                            //     data={contactData}

                                            //     fields={contactFields}
                                            //     isUpdating={isUpdating}
                                            //     canEdit={allowedToEdit}
                                            //     handleUpdate={handleUpdateContact}
                                            //     sourceComponent="contact"
                                            // />
                                        }
                                    </div>
                                </Grid>
                                <Grid item sm={4} md={4} lg={4} className="customGrid" >
                                    {
                                        !isObjectEmpty(entityData) && <div>
                                            <Activity relatedTo={[
                                                { type: "account", referenceId: entityData.accountName.optionValue, access: false }
                                            ]} handleActivityRefresh={() => { }} />
                                        </div>
                                    }

                                    <div className="detailPageDiv2">
                                        {
                                            quickLinks && quickLinks.length ?
                                                quickLinks.map((k, index) => {
                                                    return <Link key={index} className="customLink">{k.label || ''}({k.count || 0})</Link>
                                                }) :
                                                null
                                        }
                                    </div>
                                    <div className="detailPageDiv3" >
                                        <Typography color="primary" variant="h6">Related Accounts</Typography>
                                        <Box className="customBox1">

                                        </Box>
                                    </div>
                                </Grid>
                            </Grid>
                            {showConfirmBox ? (
                                <ConfirmationDialog
                                    open={showConfirmBox}
                                    message={`Are you sure you want to delete this Entity ?`}
                                    onClose={() => setShowConfirmBox(false)}
                                    onOk={handleDeleteEntity}
                                />
                            ) : null}
                        </Container>
                    </div>
                </div>
            </Layout>
        </>
    );
};

export default Roles;
