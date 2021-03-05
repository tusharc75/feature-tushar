import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Grid,
    Typography
} from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import Container from '../../components/Container'
import Layout from "../../components/Layout";
import CustomHeader from '../../components/DetailsPageHeader'
import { Link } from "react-router-dom";
import { getErrorMessage } from '../../services/util'
import CustomToast from '../../components/Helpers/CustomToast'
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { useData } from '../../StateProvider/Provider';
import { contactPage } from '../../routes/Contacts'
import { capitalize } from '../../services/util'
import DetailsPage from '../../components/Shared/DetailsPage'
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import Loader from '../../components/Loader'
import routes from '../../components/Helpers/Routes';
import '../Account/account.css'
import axiosInstance from './../../axios/axiosInstance'

const Roles = () => {
    const history = useHistory();
    const { state: { user } } = useData();
    const [headingLbl, setHeadingLbl] = useState('')
    const [alertData, setAlertData] = useState({})
    const [contactData, setContactData] = useState({})
    const [loading, setLoading] = useState(false)
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [contactFields, setContactFields] = useState([])
    const [mainPoints, setMainPoints] = useState({})
    const [isUpdating, setUpdating] = useState(false);
    const [allowedToEdit, setAllowedToEdit] = useState(false)
    const [customizedRoutes, setCustomizedRoutes] = useState([routes.contact]);
    let { id } = useParams();

    useEffect(() => {
        if (id) {
            fetchContactData()
        }
    }, [id]);

    const fetchContactData = async () => {
        setLoading(true)
        axiosInstance().get(`/contact/${id}`).then(({ data: { data } }) => {

            handleMainPoints(data)

            let name = capitalize(data.firstName || '') + ' '
            name = name + capitalize(data.middleName || '') + ' '
            name = name + capitalize(data.lastName || '')

            if (data?.salutation?.optionLabel) {
                name = data.salutation.optionLabel + name
            }

            setHeadingLbl(name)
            handleAllowToEditList(data)
            setContactData(data)
            getContactFields()
            setCustomizedRoutes([...customizedRoutes, { title: `${data.firstName} ${data.lastName}` }]);
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
        console.log("🚀 ~ file: ContactDetailPage.js ~ line 96 ~ handleMainPoints ~ tempMp", tempMp)
        setMainPoints(tempMp)
    }

    const getContactFields = () => {
        axiosInstance().get('/field?resource=Contact').then(({ data: { data } }) => {
            setContactFields(data.filter(d => d.isUpdate || d.isRead))
            setLoading(false)
        });
    };

    const handleSnackbar = (msg, type, isOpen) => {
        setAlertData({
            errorMsg: msg,
            type: type,
            open: isOpen
        })
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
            label: "Qutes",
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

    const handleDeleteContact = () => {
        if (contactData?._id) {

            axiosInstance().put(`/contact/remove`, { ids: [contactData._id] }).then(({ data }) => {
                handleSnackbar(data.message, 'success', true)
                goBackToListing()
                setShowConfirmBox(false)
            }).catch(err => {
                setShowConfirmBox(false)
            })
        }
        else {
            setShowConfirmBox(false)
        }
    }
    const goBackToListing = () => {
        history.push({
            pathname: contactPage.path
        });
    }

    const handleAllowToEditList = (contactDetails) => {
        const userId = user?.user?._id;
        let allowToEdit = false;

        if (userId) {
            allowToEdit = (contactDetails.owner?.optionValue && contactDetails.owner.optionValue == userId)

            if (!allowToEdit && contactDetails.collaborator && contactDetails.collaborator.length > 0) {
                allowToEdit = contactDetails.collaborator.findIndex(d => d.optionValue == userId) > -1;
            }

            if (allowToEdit)
                setAllowedToEdit(allowToEdit);
        }
    }

    const handleUpdateContact = (values) => {
        setUpdating(true);
        if (values.employees) {
            values.employees = parseInt(values.employees)
        }
        const updatedData = {
            ...values,
            _id: contactData._id,
        };

        axiosInstance().put('/contact', updatedData).then(({ data }) => {
            fetchContactData()
            handleSnackbar("Successfully saved", 'success', true)
            setUpdating(false);
        }).catch((err) => {
            setUpdating(false);
        });
    };
    return (
        <>
            <Layout>

                <Grid container direction="row">
                    <Grid item xs={12} className="pl-2">
                        <CustomBreadCrumbs routes={customizedRoutes} />
                    </Grid>
                </Grid>

                {
                    alertData ? <CustomToast
                        open={alertData.open || false}
                        close={() => handleSnackbar('', '', false)}
                        errorMsg={alertData.errorMsg || ''}
                        type={alertData.type || ''}
                    /> : null
                }
                <div>
                    <CustomHeader
                        heading={headingLbl}
                        logo={contactData?.contactLogo ? contactData.contactLogo : undefined}
                        mainPoints={mainPoints}
                        style={{ marginTop: "150px", minHeight: "200px" }}
                        showHeading={true}
                    >
                        <Box component="span" marginX={1} />
                        {
                            contactData?.owner?.optionValue && user?.user?._id &&
                                contactData.owner.optionValue === user.user._id ?
                                <Button
                                    variant="contained" color="secondary"
                                    onClick={() => setShowConfirmBox(true)}
                                >
                                    Delete
                            </Button>
                                : null
                        }

                    </CustomHeader>

                    <Container className="detailPageContainer">
                        <Grid container spacing={3}>
                            <Grid item sm={8} md={8} lg={8}>
                                <div className="detailPageDiv1"
                                    style={{ pointerEvents: allowedToEdit ? "" : "none" }} >
                                    {
                                        loading ? <Loader text="Fetching Data" style={{ marginTop: 100 }} /> :
                                            <DetailsPage
                                                data={contactData}

                                                fields={contactFields}
                                                isUpdating={isUpdating}
                                                canEdit={allowedToEdit}
                                                handleUpdate={handleUpdateContact}
                                            />
                                    }
                                </div>
                            </Grid>
                            <Grid item sm={4} md={4} lg={4} className="customGrid" >
                                <div className="detailPageDiv2">
                                    {
                                        quickLinks && quickLinks.length ?
                                            quickLinks.map(k => {
                                                return <><Link className="customLink">{k.label || ''}({k.count || 0})</Link><br /></>
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
                                message={`Are you sure you want to delete this Contact`}
                                onClose={() => setShowConfirmBox(false)}
                                onOk={handleDeleteContact}
                            />
                        ) : null}
                    </Container>
                </div>
            </Layout>
        </>
    );
};

export default Roles;
