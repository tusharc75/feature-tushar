import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Grid,
    Typography,
} from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import _ from "lodash";
import Container from "../../components/Container";
import { GetFields } from '../../axios/index';
import Layout from "../../components/Layout";
import CustomHeader from '../../components/DetailsPageHeader'
import { accountPage } from '../../routes/Accounts'
import { getAccountData } from '../../axios/accounts'
import { Link } from "react-router-dom";
import { getErrorMessage } from '../../services/util'
import DetailPage from './DetailPage'
import Loader from '../../components/Loader'
import CustomToast from '../../components/Helpers/CustomToast'
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { useData } from '../../StateProvider/Provider';
import { deleteAccounts, updateAccount, getRelatedContacts } from '../../axios/accounts'
import DetailsPage from '../../components/Shared/DetailsPage'
import "./account.css";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import routes from '../../components/Helpers/Routes';
import RelatedContactsBox from './RelatedContacts'

const Roles = () => {
    const history = useHistory();
    const { state: { user } } = useData();
    const [headingLbl, setHeadingLbl] = useState('')
    const [allowedToEdit, setAllowedToEdit] = useState(false)
    const [isUpdating, setUpdating] = useState(false);
    const [alertData, setAlertData] = useState({})
    const [accountData, setAccountData] = useState({})
    const [relatedContacts, setRelatedContacts] = useState([])
    const [loading, setLoading] = useState(false)
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [accountFields, setAccountFields] = useState([])
    const [mainPoints, setMainPoints] = useState({})
    const [customizedRoutes, setCustomizedRoutes] = useState([routes.account]);

    let { id } = useParams();

    useEffect(() => {
        if (id) {
            fetchAccountData()
        }
    }, [id]);

    useEffect(() => {
        if (accountData._id && relatedContacts.length == 0) {
            fetchRelatedContacts()
        }
    }, [accountData])

    const fetchAccountData = async () => {
        setLoading(true)
        try {
            let data = await getAccountData(id)
            if (data.status === 200) {
                let tData = data.data
                setHeadingLbl(tData.accountName || '')
                setCustomizedRoutes([...customizedRoutes, { title: tData.accountName }]);
                handleAllowToEditList(tData)
                handleMainPonts(tData)
                setAccountData(tData)
                if (accountFields.length == 0) {
                    getAccountFields()
                }
                else {
                    setLoading(false)
                }

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

    const handleAllowToEditList = (rec) => {
        let userId = user?.user?._id
        let tList = []
        if (userId) {
            if (rec?.collaborator && rec.collaborator.length) {
                rec.collaborator.map(obj => {
                    tList.push(obj.optionValue)
                })
            }
            if (rec?.owner?.optionValue) {
                tList.push(rec.owner.optionValue)
            }
            if (tList && tList.indexOf(userId) >= 0) {
                setAllowedToEdit(true)
            }
        }
    }
    const handleMainPonts = (data) => {
        let mainPoints = {
            Phone: data.phone || ''
        }
        if (data?.parentAccount?.optionLabel) {
            mainPoints["Parent Account"] = data.parentAccount.optionLabel
        }
        if (data?.owner?.optionLabel) {
            mainPoints["Primary Owner"] = data.owner.optionLabel
        }
        setMainPoints(mainPoints)
    }

    const getAccountFields = () => {
        GetFields('Account').then(({ data }) => {

            setAccountFields(data)
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

    const handleDeleteAcc = () => {
        if (accountData?._id) {

            deleteAccounts({ ids: [accountData._id] }).then((data) => {
                if (data.status === 200) {
                    handleSnackbar(data.message, 'success', true)
                    goBackToListing()
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
    const handleUpdateAccount = (values) => {
        setUpdating(true);
        if (values.employees) {
            values.employees = parseInt(values.employees)
        }
        const updatedData = {
            ...values,
            _id: accountData._id,
        };

        updateAccount(updatedData)
            .then(({ data }) => {
                fetchAccountData()
                handleSnackbar("Successfully saved", 'success', true)
                setUpdating(false);
            })
            .catch((err) => {
                console.log(err);
                let errMes = getErrorMessage(err)
                if (errMes) {
                    handleSnackbar(errMes, 'error', true)
                }
                setUpdating(false);
            });
    };
    const goBackToListing = () => {
        history.push({
            pathname: accountPage.path
        });
    }

    const fetchRelatedContacts = () => {
        getRelatedContacts(accountData._id)
            .then((data) => {
                setRelatedContacts(data.data)
            })
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
                        logo={accountData?.accountLogo ? accountData.accountLogo : undefined}
                        mainPoints={mainPoints}
                        style={{ marginTop: "150px", minHeight: "200px" }}
                        showHeading={true}
                    >
                        <Box component="span" marginX={1} />
                        {
                            accountData?.owner?.optionValue && user?.user?._id &&
                                accountData.owner.optionValue === user.user._id ?
                                <Button
                                    variant="contained" color="secondary"
                                    onClick={() => setShowConfirmBox(true)}
                                >
                                    Delete
                            </Button> : null
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
                                                data={accountData}
                                                fields={accountFields}
                                                isUpdating={isUpdating}
                                                canEdit={allowedToEdit}
                                                handleUpdate={handleUpdateAccount}
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
                                    <Typography color="primary" variant="h6">Related Contacts</Typography>
                                    <Box className="customBox1">
                                        {/* <RelatedContactsBox
                                            contacts={relatedContacts}
                                        /> */}
                                    </Box>
                                </div>
                            </Grid>
                        </Grid>
                        {showConfirmBox ? (
                            <ConfirmationDialog
                                open={showConfirmBox}
                                message={`Are you sure you want to delete this Account ${accountData.accountName || ''}`}
                                onClose={() => setShowConfirmBox(false)}
                                onOk={handleDeleteAcc}
                            />
                        ) : null}
                    </Container>
                </div>
            </Layout>
        </>
    );
};

export default Roles;
