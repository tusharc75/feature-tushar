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
import { getContactData } from '../../axios/contacts'
import { Link } from "react-router-dom";
import { getErrorMessage } from '../../services/util'
import CustomToast from '../../components/Helpers/CustomToast'
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { useData } from '../../StateProvider/Provider';
import { deleteContacts } from '../../axios/contacts'
import { capitalize } from '../../services/util'
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import routes from '../../components/Helpers/Routes';
import '../Account/account.css'
import axiosInstance from './../../axios/axiosInstance'

const Roles = () => {
    const { state: { user } } = useData();
    const [headingLbl, setHeadingLbl] = useState('')
    const [alertData, setAlertData] = useState({})
    const [contactData, setContactData] = useState({})
    const [loading, setLoading] = useState(false)
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [data, setData] = useState({})
    const [mainPoints, setMainPoints] = useState({})
    const [customizedRoutes, setCustomizedRoutes] = useState([routes.contact]);
    let { id } = useParams();

    useEffect(() => {
        if (id) {
            fetchContactData()
        }
    }, [id]);

    const fetchContactData = async () => {
        setLoading(true)
        try {
            let data = await getContactData(id)
            if (data.status === 200) {
                let tData = data.data
                setCustomizedRoutes([...customizedRoutes, { title: `${tData.firstName} ${tData.lastName}` }]);

                let name = capitalize(tData.firstName || '') + ' '
                name = name + capitalize(tData.middleName || '') + ' '
                name = name + capitalize(tData.lastName || '')
                let tempMp = {
                    phone: tData.phone || '',
                    email: tData.email || '',
                    title: tData.title || '',
                }

                if (tData?.salutation?.optionLabel) {
                    name = tData.salutation.optionLabel + name
                }
                if (tData?.accountName?.optionLabel) {
                    tempMp["Account Name"] = tData.accountName.optionLabel
                }
                setHeadingLbl(name)
                setMainPoints(tempMp)
                setContactData(tData)
                getContactFields(tData)
            }
        }
        catch (err) {
            setLoading(false)
            let errMes = getErrorMessage(err)
            if (errMes) {
                handleSnackbar(errMes, 'error', true)
            }
        }
    }

    const getContactFields = (values) => {

        axiosInstance().get('/field?resource=Contact').then(({ data }) => {
            setData(data)
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
            label: "Qoutes",
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
        console.log('contactData', contactData)
        if (contactData?._id) {
            deleteContacts([contactData._id]).then(({ data }) => {
                if (data.status === 200) {
                    handleSnackbar(data.message, 'success', true)
                }
                setShowConfirmBox(false)
            }).catch(err => {
                let errMes = getErrorMessage(err)
                if (errMes) {
                    handleSnackbar(errMes, 'error', true)
                }
                setShowConfirmBox(false)
            })
        }
        else {
            setShowConfirmBox(false)
        }

    }
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
                        mainPoints={mainPoints}
                        style={{ marginTop: "150px", minHeight: "200px" }}
                        showHeading={true}
                    >
                        <Box component="span" marginX={1} />
                        {/* {
                            contactData?.owner?.optionValue && user?.user?._id &&
                                contactData.owner.optionValue === user.user._id ? */}
                        <Button
                            variant="contained" color="secondary"
                            onClick={() => setShowConfirmBox(true)}
                        >
                            Delete
                            </Button>
                        {/* : null
                        } */}

                    </CustomHeader>

                    <Container className="detailPageContainer">
                        <Grid container spacing={3}>
                            <Grid item sm={8} md={8} lg={8}>
                                <div className="detailPageDiv1" >
                                    {/* {
                                        loading ? <Loader text="Fetching Data" style={{ marginTop: 100 }} /> :
                                            <DetailPage
                                                data={data}
                                            />
                                    } */}
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
                                    <Typography color="primary" variant="h6">Related Contacts</Typography>
                                    <Box className="customBox1">

                                    </Box>
                                </div>
                            </Grid>
                        </Grid>
                        {showConfirmBox ? (
                            <ConfirmationDialog
                                open={showConfirmBox}
                                message={`Are you sure you want to delete this Account ${contactData.accountName || ''}`}
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
