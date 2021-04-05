import React, { useState, useEffect, useContext } from "react";
import {
    Box,
    Button,
    Grid,
    Typography,
    IconButton,
} from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import _ from "lodash";
import { Skeleton } from "@material-ui/lab";
import Container from "../../components/Container";
import Layout from "../../components/Layout";
import DetailsPageHeader from '../../components/DetailsPageHeader'
import { accountPage } from '../../routes/Accounts'
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { useData } from '../../StateProvider/Provider';
import DetailsPage from '../../components/Shared/DetailsPage'
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import routes from '../../components/Helpers/Routes';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import BoxWithBorder from "../../components/BoxWithBorder";
import RelatedContactsBox from './RelatedContacts'
import axiosInstance from './../../axios/axiosInstance'
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AccountHierarchy from './AccountHierarchy';
import Activity from "../../components/Activity";
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import accountClass from "./account.module.scss"
import ManageContactDialog from '../Contact/ManageContact/index';
import DeleteButton from '../../components/Helpers/DeleteButton'
import { makeStyles } from "@material-ui/core/styles";
import { removeEmptyKeys, getObjKeysWithValues, isObjectEmpty } from "../../constants/helpers";
import ManageAccount from "./ManageAccount/ManageAccount";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import FullScreenDialog from "../../components/Helpers/FullScreenDialog";
import QuickLinks, { IQuickLinks } from "../../components/QuickLinks/QuickLinks";
import OpportunityInAccordian from "../../components/OpportunityInAccordian/OpportunityInAccordian";
import { TiFlowChildren } from 'react-icons/ti';
import ManageOpportunityDialog from "../Opportunities/ManageOpportunityDialog/ManageOpportunityDialog";
import CustomDynamicGrid from "../../components/CustomDynamicGrid/CustomDynamicGrid";

const useStyles = makeStyles((theme) => ({
    container: {
        padding: "0px",
        minHeight: "auto"
    },
    opportunityTab: {
        marginTop: '10px'
    }
}));

const Roles = (props) => {
    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();
    const classes = useStyles();
    const { accountRoute,accountResource,accountPerm } = props;
    const { state: { user } }: any = useData();
    const [headingLbl, setHeadingLbl] = useState('')
    const [isUpdating, setUpdating] = useState(false);
    const [accountData, setAccountData] = useState<any>({})
    const [relatedContacts, setRelatedContacts] = useState([])
    const [opportunities, setOpportunities] = useState([])
    const [loading, setLoading] = useState(false)
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [showApproveDisapproveConfirmBox, setShowApproveDisapproveConfirmBox] = useState(false);
    const [accountFields, setAccountFields] = useState([])
    const [mainPoints, setMainPoints] = useState({})
    const [customizedRoutes, setCustomizedRoutes] = useState<any>([]);
    const [currentTabIndex, setCurrentTabIndex] = useState(0);
    const [accountHierarchyData, setAccountHierarchyData] = useState([]);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [relatedContactsLoading, setRelatedContactsLoading] = useState(false)
    const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);
    const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
    const [canEdit, setCanEdit] = useState(false)

    const [showAccountHierarchyInFullScreenDialog, setShowAccountHierarchyInFullScreenDialog] = useState(false)

    let { id } = useParams();

    const [accountPermissions, setAccountPermissions] = useState({ isCreate: false, isUpdate: false, isRead: false, isDelete: false, approveAccount: false });

    useEffect(() => {
        const data = user.role?.sideBar;

        if (data) {
            const hasAccountPermission = data.find((d: any) => d.name === accountPerm);
            if (hasAccountPermission) {
                setAccountPermissions(
                    {
                        isCreate: hasAccountPermission.isCreate,
                        isUpdate: hasAccountPermission.isUpdate,
                        isRead: hasAccountPermission.isRead,
                        isDelete: hasAccountPermission.isDelete,
                        approveAccount: user.user?.permissions?.approveAccount
                    });
            }
        }
    }, [user]);

    useEffect(() => {
        if (id) {
            fetchAccountData();
            fetchRelatedData();
        }
    }, [id]);

    const fetchRelatedData = () => {
        axiosInstance().get(`/${accountRoute}/related/${id}`).then(({ data: { data } }) => {
            setRelatedContacts(data.Contact && data.Contact["Account_Name"] ? data.Contact["Account_Name"] : []);
            setOpportunities(data.Opportunity && data.Opportunity["Account_Name"] ? data.Opportunity["Account_Name"] : []);
            setRelatedContactsLoading(false)
        });
    }

    const fetchAccountData = async () => {
        setLoading(true)

        axiosInstance().get(`/${accountRoute}/${id}`).then(({ data: { data } }) => {
            setCustomizedRoutes([routes.account, { title: data.accountName }]);

            setHeadingLbl(data.accountName || '')
            handleMainPonts(data)
            setAccountData(data)
            setCanEdit([...data?.collaborator, data?.owner].some(obj => obj.optionValue === user.user._id))

            if (data.parentHierarchy && data.parentHierarchy.length > 0) {

                let accounts = [...data.parentHierarchy, {
                    _id: data._id,
                    accountName: data.accountName,
                    typeOfAccount: data.typeOfAccount,
                    industry: data.industry,
                    typeOfBusiness: data.typeOfBusiness,
                    phone: data.phone,
                    type: "child",
                    current: true,
                    parentAccount: data.parentAccount ? {
                        _id: data.parentAccount.optionValue,
                        accountName: data.parentAccount.optionLabel,
                    } : null
                    // parentAccountName: data.parentAccount?.optionLabel,
                    // parentAccount: data.parentAccount?.optionValue
                }];
                let newData = [];

                accounts.map(account => {
                    if (isObjectEmpty(account)) return true;

                    const updatedAccount = {
                        _id: account._id,
                        accountName: account.accountName,
                        typeOfAccount: account.typeOfAccount,
                        industry: account.industry,
                        typeOfBusiness: account.typeOfBusiness,
                        phone: account.phone,
                        type: "child",
                        current: account.current
                    };

                    if (account.parentAccount) {
                        updatedAccount["parentAccountText"] = account.parentAccount.accountName;
                        updatedAccount["parentAccountId"] = account.parentAccount._id;
                    } else {
                        updatedAccount["type"] = "parent";
                    }

                    newData.push(updatedAccount);
                })

                setAccountHierarchyData([...newData]);

            } else {
                setAccountHierarchyData([
                    {
                        _id: data._id,
                        accountName: data.accountName,
                        typeOfAccount: data.typeOfAccount,
                        industry: data.industry,
                        typeOfBusiness: data.typeOfBusiness,
                        phone: data.phone,
                        current: true
                    }
                ])
            }

            if (accountFields.length === 0) {
                getAccountFields()
            }
            else {
                setLoading(false)
            }
        }).catch(() => {
            setLoading(false)
        })
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
        axiosInstance().get(`/field?resource=${accountResource}`).then(({ data: { data } }) => {
            setAccountFields(data.filter(d => d.isUpdate || d.isRead))
            setLoading(false)
        });
    };

    const quickLinks: IQuickLinks[] = [
        {
            label: "Account Heirarchy",
            redirect: false,
            onClick: () => {
                setShowAccountHierarchyInFullScreenDialog(true);
            },
            icon: <TiFlowChildren />
        },
        {
            label: "Projects",
            count: 0
        },
        {
            label: "Opportunity",
            count: opportunities ? opportunities.length : 0
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
            count: relatedContacts ? relatedContacts.length : 0,
            to: "/contact"
        },
    ]

    const handleDeleteAcc = () => {
        if (accountData?._id) {
            axiosInstance().put(`/${accountRoute}/remove`, { ids: [accountData._id] }).then(({ data }) => {
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

    const handleApproveDisapprove = () => {
        axiosInstance().post(`/${accountRoute}/approve`, { ids: [accountData._id], approved: !accountData.static?.approved })
            .then(() => {
                fetchAccountData()
                setShowApproveDisapproveConfirmBox(false);
            }).catch(() => {
                setShowApproveDisapproveConfirmBox(false);
            })
    }

    const onUpdateAccount = (values) => {

        setUpdating(true);

        const updatedData = {
            ...values,
            _id: accountData._id,
        };

        axiosInstance().put(`/${accountRoute}`, removeEmptyKeys(updatedData))
            .then(({ data }) => {
                fetchAccountData()
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setUpdating(false);
                setOpenUpdateDialog(false)
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                setUpdating(false);
            });
    };

    const goBackToListing = () => {
        history.push({
            pathname: accountPage.path
        });
    }

    const handleOpneUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const closeUpdateDIalog = () => {
        setOpenUpdateDialog(false);
    };

    const handleViewAll = (path, state) => {
        history.push({
            pathname: path,
            state: {
                ...state
            },
        });
    };

    const handleCreateContact = () => {
        setShowCreateContactDialog(true);
    }
    return (
        <>
            <Layout>
                <Grid container direction="row">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <div>
                    {
                        <DetailsPageHeader
                            loading={loading}
                            heading={headingLbl}
                            logo={accountData?.accountLogo ? accountData.accountLogo : undefined}
                            mainPoints={mainPoints}
                            showHeading={true}
                        >
                            {
                                accountPermissions.approveAccount && <>
                                    <Button
                                        variant="contained"
                                        color={accountData.static?.approved ? "secondary" : "primary"}
                                        onClick={() => { setShowApproveDisapproveConfirmBox(true) }}
                                    >
                                        {accountData.static?.approved ? 'Disapprove' : "Approve"}
                                    </Button>
                                    <Box component="span" marginX={1} />
                                </>
                            }

                            {
                                accountPermissions.isUpdate && canEdit && <>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleOpneUpdateDialog}
                                    >
                                        Edit
                                    </Button>
                                    <Box component="span" marginX={1} />
                                </>
                            }

                            {
                                accountPermissions.isDelete && accountData?.owner?.optionValue && user?.user?._id &&
                                    accountData.owner.optionValue === user.user._id ?
                                    <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                                    : null
                            }
                        </DetailsPageHeader>
                    }

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12} md={8} lg={8}>
                            <Container padding="8px">
                                <BoxWithBorder padding="8px">
                                    {loading ? (
                                        <Grid container spacing={2}>
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                                <Grid item sm={6} md={6}>
                                                    <Skeleton variant="text" width="100px" height="16px" />
                                                    <Box marginY={1} />
                                                    <Skeleton width="100%" height="50px" />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ) : (
                                        <Box>
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
                                                <Box hidden={currentTabIndex !== 0}>
                                                    <DetailsPage data={accountData} fields={accountFields} />
                                                </Box>

                                                <Box hidden={currentTabIndex !== 1}>
                                                    <AccountHierarchy data={accountHierarchyData} currentAccountId={accountData._id} />
                                                </Box>

                                            </>

                                        </Box>
                                    )}
                                </BoxWithBorder>
                                <Box marginY={2} />

                                <Container styles={{ padding: "0px", minHeight: "auto" }}>
                                    <OpportunityInAccordian opportunities={opportunities} onNewOpportunityAdd={() => { fetchRelatedData() }} accountId={accountData._id} recordsPerLine={2} />
                                    {/* onChange={handleChange('panel1')} */}
                                </Container>
                            </Container>
                        </Grid>
                        <Grid item xs={12} sm={12} md={4} lg={4}
                            className={`${accountClass.account_activities_div}`} >
                            <Container styles={{ padding: "8px", minHeight: "auto", width: '100%' }} >
                                <Grid container>
                                    <Grid item xs={12}>
                                        {
                                            accountData && <div>
                                                <Activity relatedTo={[
                                                    { type: "account", referenceId: accountData._id, access: true }
                                                ]} handleActivityRefresh={() => { }} />
                                            </div>
                                        }
                                    </Grid>
                                    <Grid item xs={12}>
                                        <div className="m-3">
                                            <QuickLinks quickLinks={quickLinks} />
                                        </div>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <BoxWithBorder style={{ marginTop: "3%", padding: '0px' }}>
                                            <div className={`${accountClass.detail_page_div3}`}>
                                                <div className={`${accountClass.related_contacts}`}>
                                                    <Typography color="primary"
                                                        variant="h6"
                                                        style={{ margin: "0 10px" }} >Related Contacts</Typography>
                                                    <span>
                                                        <IconButton
                                                            onClick={handleCreateContact}
                                                            color="primary"
                                                            size="small" >
                                                            <ControlPointIcon />
                                                        </IconButton> </span>
                                                </div>
                                                {
                                                    relatedContactsLoading ? (
                                                        <CommonSkeleton lenArray={[...Array(4).keys()]} />
                                                    ) : <>
                                                        <Box className={`${accountClass.custom_box1}`}>
                                                            <RelatedContactsBox
                                                                contacts={relatedContacts}
                                                                accountName={accountData.accountName}
                                                            />
                                                        </Box>
                                                        {/* <div className={`${accountClass.view_all_btn}`}>
                                                            <Button
                                                                variant="outlined"
                                                                className={`${accountClass.btn}`}
                                                            >View All</Button></div> */}
                                                    </>
                                                }
                                            </div>
                                        </BoxWithBorder>
                                    </Grid>
                                </Grid>
                            </Container>
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
                    {openUpdateDialog && (
                        <ManageAccount
                            isNew={false}
                            open={openUpdateDialog}
                            onClose={closeUpdateDIalog}
                            entityData={{ fields: accountFields.map((f) => { return f.fieldData }), initialValues: getObjKeysWithValues(accountData, accountFields.map((f) => { return f.fieldData })) }}
                            loading={loading}
                            handleSubmit={onUpdateAccount}
                            accountResource={accountResource}
                            accountRoute={accountRoute}
                        />
                    )}

                    {
                        showCreateOpportunityDialog && <ManageOpportunityDialog
                            open={showCreateOpportunityDialog}
                            onClose={() => setShowCreateOpportunityDialog(false)}
                            onSuccess={() => {
                                setShowCreateOpportunityDialog(false);
                                // fetchOpportunities()
                            }}
                            accountId={accountData._id}
                        />
                    }
                    {
                        showCreateContactDialog && <ManageContactDialog
                            open={showCreateContactDialog}
                            onClose={() => {
                                setShowCreateContactDialog(false);
                                // fetchRelatedContacts();
                            }}
                            accountId={accountData._id}
                        />
                    }
                    {
                        showAccountHierarchyInFullScreenDialog && <FullScreenDialog
                            heading="Account Hierarchy"
                            open={showAccountHierarchyInFullScreenDialog}
                            close={() => { setShowAccountHierarchyInFullScreenDialog(false) }}>
                            <AccountHierarchy data={accountHierarchyData} currentAccountId={accountData._id} />
                        </FullScreenDialog>
                    }
                </div>
            </Layout>
        </>
    );
};

export default Roles;
