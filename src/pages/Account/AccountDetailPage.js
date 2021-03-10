import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Grid,
    Typography
} from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import _ from "lodash";
import Container from "../../components/Container";
import Layout from "../../components/Layout";
import CustomHeader from '../../components/DetailsPageHeader'
import { accountPage } from '../../routes/Accounts'
import { Link } from "react-router-dom";
import Loader from '../../components/Loader'
import CustomToast from '../../components/Helpers/CustomToast'
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { useData } from '../../StateProvider/Provider';
import DetailsPage from '../../components/Shared/DetailsPage'
import "./account.css";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import routes from '../../components/Helpers/Routes';
import RelatedContactsBox from './RelatedContacts'
import axiosInstance from './../../axios/axiosInstance'
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AccountHierarchy from './AccountHierarchy';

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
    const [showApproveDisapproveConfirmBox, setShowApproveDisapproveConfirmBox] = useState(false);
    const [accountFields, setAccountFields] = useState([])
    const [mainPoints, setMainPoints] = useState({})
    const [customizedRoutes, setCustomizedRoutes] = useState();
    const [currentTabIndex, setCurrentTabIndex] = useState(0);
    const [accountHeirarchyData, setAccountHeirarchyData] = useState([]);

    let { id } = useParams();

    const [accountPermissions, setAccountPermissions] = useState({ isCreate: false, isRead: false, isDelete: false, approveAccount: false });

    useEffect(() => {
        const data = user.role?.sideBar;

        if (data) {
            const hasAccountPermission = data.find(d => d.name == "Account");
            if (hasAccountPermission) {
                setAccountPermissions(
                    {
                        isCreate: hasAccountPermission.isCreate,
                        isRead: hasAccountPermission.isRead,
                        isDelete: hasAccountPermission.isDelete,
                        approveAccount: user.user?.permissions?.approveAccount
                    });
            }
        }
    }, [user]);

    useEffect(() => {
        if (id) {
            fetchAccountData()
        }
    }, [id]);

    useEffect(() => {
        if (user && accountData) {
            handleAllowToEditList(accountData)
        }
    }, [user]);

    useEffect(() => {
        if (accountData._id && relatedContacts.length == 0) {
            fetchRelatedContacts()
        }
    }, [accountData])

    const fetchAccountData = async () => {
        setLoading(true)

        axiosInstance().get(`/account/${id}`).then(({ data: { data } }) => {
            setCustomizedRoutes([routes.account, { title: data.accountName }]);

            setHeadingLbl(data.accountName || '')
            handleAllowToEditList(data)
            handleMainPonts(data)
            setAccountData(data)

            if (data.parentHierarchy && data.parentHierarchy.length > 0) {

                let accounts = data.parentHierarchy;
                const { parentHierarchy, ...rest } = data;
                accounts.push({ ...rest, current: true });

                var map = {}, node, roots = [], i;

                for (i = 0; i < accounts.length; i += 1) {
                    map[accounts[i]._id] = i; // initialize the map
                    accounts[i].children = []; // initialize the children
                }

                for (i = 0; i < accounts.length; i += 1) {
                    node = accounts[i];
                    if (node.parentAccount) {
                        // if you have dangling branches check that map[node.parentId] exists
                        accounts[map[node.parentAccount.optionValue]].children.push(node);
                    } else {
                        roots.push(node);
                    }
                }
                setAccountHeirarchyData([...roots]);
            } else {
                setAccountHeirarchyData([
                    {
                        _id: data._id,
                        accountName: data.accountName,
                        typeOfAccount: data.typeOfAccount,
                        industry: data.industry,
                        typeOfBusiness: data.typeOfBusiness,
                        parentAccount: data.parentAccount,
                        phone: data.phone,
                        children: []
                    }
                ])
            }


            //  setAccountHeirarchyData

            if (accountFields.length == 0) {
                getAccountFields()
            }
            else {
                setLoading(false)
            }
        }).catch(() => {
            setLoading(false)
        })
    }

    const handleAllowToEditList = (accountDetails) => {
        const userId = user?.user?._id;
        let allowToEdit = false;

        if (userId) {
            allowToEdit = (accountDetails.owner?.optionValue && accountDetails.owner.optionValue == userId)

            if (!allowToEdit && accountDetails.collaborator && accountDetails.collaborator.length > 0) {
                allowToEdit = accountDetails.collaborator.findIndex(d => d.optionValue == userId) > -1;
            }

            if (allowToEdit)
                setAllowedToEdit(allowToEdit);
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
        axiosInstance().get(`/field?resource=Account`).then(({ data: { data } }) => {
            setAccountFields(data.filter(d => d.isUpdate || d.isRead))
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

    const handleDeleteAcc = () => {
        if (accountData?._id) {
            axiosInstance().put(`/account/remove`, { ids: [accountData._id] }).then(({ data }) => {
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

    const handleApproveDisapprove = () => {
        axiosInstance().post(`/account/approve`, { ids: [accountData._id], approved: !accountData.static?.approved })
            .then(() => {
                fetchAccountData()
                setShowApproveDisapproveConfirmBox(false);
            }).catch(() => {
                setShowApproveDisapproveConfirmBox(false);
            })
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

        axiosInstance().put('/account', updatedData)
            .then(() => {
                fetchAccountData()
                handleSnackbar("Successfully saved", 'success', true)
                setUpdating(false);
            })
            .catch((err) => {
                setUpdating(false);
            });
    };
    const goBackToListing = () => {
        history.push({
            pathname: accountPage.path
        });
    }

    const fetchRelatedContacts = () => {
        axiosInstance().get(`/contact/related-contact/${accountData._id}`)
            .then(({ data: { data } }) => {
                setRelatedContacts(data)
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
                            accountPermissions.approveAccount && <>
                                <Button
                                    variant="contained" color={accountData.static?.approved ? "secondary" : "primary"}
                                    onClick={() => setShowApproveDisapproveConfirmBox(true)}
                                >
                                    {accountData.static?.approved ? "Disapprove" : "Approve"}
                                </Button>
                                <Box component="span" marginX={1} />
                            </>
                        }
                        {
                            accountPermissions.isDelete && accountData?.owner?.optionValue && user?.user?._id &&
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
                                            <>
                                                <Tabs
                                                    className="mb-4"
                                                    value={currentTabIndex}
                                                    onChange={(index, newValue) => { setCurrentTabIndex(newValue) }}
                                                    indicatorColor="primary"
                                                    textColor="primary"
                                                    aria-label="icon tabs example"
                                                >
                                                    <Tab label="Details" aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
                                                    <Tab label="Account Hierarchy" aria-controls="a11y-tabpanel-1" id="a11y-tab-1" />
                                                </Tabs>
                                                <Box index={0} hidden={currentTabIndex !== 0}>
                                                    <DetailsPage
                                                        data={accountData}
                                                        fields={accountFields}
                                                        isUpdating={isUpdating}
                                                        canEdit={allowedToEdit}
                                                        handleUpdate={handleUpdateAccount}
                                                    />
                                                </Box>
                                                <Box index={1} hidden={currentTabIndex !== 1}>
                                                    <AccountHierarchy data={accountHeirarchyData} />
                                                </Box>
                                            </>
                                    }
                                </div>
                            </Grid>
                            <Grid item sm={4} md={4} lg={4} className="customGrid" >
                                <div className="detailPageDiv2">
                                    {
                                        quickLinks && quickLinks.length ?
                                            quickLinks.map((k, index) => {
                                                return <Link key={index} to={k} className="customLink">{k.label || ''}({k.count || 0})</Link>
                                            }) :
                                            null
                                    }
                                </div>
                                <div className="detailPageDiv3" >
                                    <Typography color="primary" variant="h6">Related Contacts</Typography>
                                    <Box className="customBox1">
                                        <RelatedContactsBox
                                            contacts={relatedContacts}
                                        />
                                    </Box>
                                </div>
                            </Grid>
                        </Grid>
                        {
                            showConfirmBox ? (
                                <ConfirmationDialog
                                    open={showConfirmBox}
                                    message={`Are you sure you want to delete this Account ${accountData.accountName || ''}`}
                                    onClose={() => setShowConfirmBox(false)}
                                    onOk={handleDeleteAcc}
                                />
                            ) : null
                        }
                        {
                            showApproveDisapproveConfirmBox ? (
                                <ConfirmationDialog
                                    open={showApproveDisapproveConfirmBox}
                                    message={`Are you sure you want to ${accountData.static?.approved ? 'disapprove' : "approve"} this Account ?`}
                                    onClose={() => setShowApproveDisapproveConfirmBox(false)}
                                    onOk={handleApproveDisapprove}
                                />
                            ) : null
                        }
                    </Container>
                </div>
            </Layout>
        </>
    );
};

export default Roles;
