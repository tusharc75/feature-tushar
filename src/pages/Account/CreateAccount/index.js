import React, { useEffect, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import CreateAccount from './CreateAccount'
import { getErrorMessage } from '../../../services/util'
import { getObjKeys, formValidation } from '../../../constants/helpers';
import { accountPage, accountDetailPage } from '../../../routes/Accounts'
import { craeteAccount, getAccountData, updateAccount, getDataToClone } from '../../../axios/accounts'
import { GetFields } from '../../../axios/index';
import { useHistory, useParams } from 'react-router-dom'
import { useData } from '../../../StateProvider/Provider';
import _ from 'lodash'

const styles = (theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
});

const DialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            ) : null}
        </MuiDialogTitle>
    );
});

export default function CreateAccountMain(props) {

    const { open, onClose, id, showSuccessMes } = props
    const { state: { user } } = useData();
    const history = useHistory();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [loading, setLoading] = useState(false)
    const [updateFieldValues, setUpdateFieldValues] = useState({})
    const [saveAndNewLoading, setSaveAndNewLoading] = useState(false)
    const [alertData, setAlertData] = useState({})

    useEffect(async () => {
        if (id) {
            GetFields('Account').then(({ data }) => {
                const newFields = [];
                data.map((_f) => newFields.push(_f.fieldData));

                getDataToClone(id).then((dataToClone) => {
                    setEntityData({
                        fields: newFields,
                        initialValues: dataToClone.data ? dataToClone.data : getObjKeys("", newFields),
                    });
                    setLoading(false);
                }, error => {
                    setLoading(false);
                });
            });
        }
        else if (user) {
            getAccountFields(user.user.brand);
        }
    }, [user]);

    const fetchAccountData = async () => {
        setLoading(true)
        try {
            let data = await getAccountData(id)
            if (data.status === 200 && Object.keys(data.data)) {
                let initialVal = data.data
                setUpdateFieldValues(initialVal)
                getAccountFields(undefined, initialVal)
            }
        }
        catch (err) {
            let errMes = getErrorMessage(err)
            if (errMes) {
                handleSnackbar(errMes, 'error', true)
            }
        }

    }
    const getAccountFields = (brandId, values) => {
        GetFields('Account', brandId).then(({ data }) => {
            const newFields = [];
            data.map((_f) => newFields.push(_f.fieldData));
            setEntityData({
                fields: newFields,
                initialValues: values ? values : getObjKeys("", newFields),
            });
            setLoading(false)
        });
    };

    const goToBackPage = (id) => {
        let state = {}
        let tempPath = accountDetailPage.path
        if (id && typeof id === 'string') {
            tempPath = tempPath + "/" + id
        }
        history.push({
            pathname: tempPath
        })
    }

    const goToBackPageListing = (e) => {
        history.push({
            pathname: accountPage.path,
        })
    }

    const handleLoading = (action, isSaveAndNew = false) => {
        if (isSaveAndNew) {
            setSaveAndNewLoading(action)
        }
        else {
            setLoading(action)
        }
    }

    const getModiFiedValues = values => {
        values = { ...values }

        if (values.employees === "") {
            delete values.employees
        }
        else {
            values.employees = parseInt(values.employees)
        }

        let tempFields = _.cloneDeep(entityData.fields)
        tempFields.map(f => {
            let fName = f.fieldName
            if (f.type === "dropDown" && values[fName]) {
                if (f?.option && f.option.length) {
                    f.option.filter(obj => {
                        if (obj.optionValue === values[fName]) {
                            values[fName] = obj
                            return true
                        }
                    })
                }
            }
            if (f.type === "multiSelect" && values[fName] && values[fName].length > 0) {
                if (f?.option && f.option.length) {
                    f.option.map(obj => {
                        let i = values[fName].indexOf(obj.optionValue)
                        if (i >= 0) {
                            values[fName][i] = obj
                        }
                    })
                }
            }
        })
        Object.keys(values).forEach(key => {
            if (!values[key] || (typeof values[key] === 'object' && Object.keys(values[key]).length == 0)) {
                delete values[key]
            }
        })

        // if (user?.user?.brand) values.brand = user.user.brand
        return values
    }

    const showErroeMes = (err, saveAndNew) => {
        let errMes = getErrorMessage(err)
        if (errMes) {
            handleSnackbar(errMes, 'error', true)
        }
        handleLoading(false, saveAndNew)
    }
    const handleCreateAccount = async (values, saveAndNew, setValues) => {
        try {
            let data
            data = await craeteAccount(values)
            if (data.status === 200) {
                onClose({ fetch: true })
                setValues(getObjKeys("", _.cloneDeep(entityData.fields)));
                showSuccessMes(data.message, 'success', true)
                // handleSnackbar(data.message, 'success', true)
                handleLoading(false, saveAndNew)
            }
        }
        catch (err) {
            showErroeMes(err, saveAndNew)
        }
    }
    const handleSnackbar = (msg, type, isOpen) => {
        setAlertData({
            errorMsg: msg,
            type: type,
            open: isOpen
        })
    };
    const handleSubmit = async (setTouched, values, setValues, setErrors, saveAndNew = false, resetForm) => {
        const errors = formValidation(values, _.cloneDeep(entityData.fields));
        if (Object.keys(errors).length) {
            entityData.fields.forEach((input) => {
                if (input.required) {
                    setTouched(input.fieldName, true);
                }
            });
        } else {
            handleLoading(true, saveAndNew)
            values = getModiFiedValues(values)
            handleCreateAccount(values, saveAndNew, setValues)
            setErrors({});
        }

    }

    return (<Dialog
        // fullWidth={true}
        maxWidth="md"
        aria-labelledby="customized-dialog-title"
        onClose={onClose}
        open={open}
    >
        <DialogTitle id="customized-dialog-title"
            style={{ paddingBottom: "1px", paddingLeft: "24px" }}
            onClose={onClose}>
            Add Account
        </DialogTitle>
        <CreateAccount
            alertData={alertData}
            handleSnackbar={handleSnackbar}
            entityData={entityData}
            onClose={onClose}
            loading={loading}
            handleSubmit={handleSubmit}
        />
    </Dialog>
    );
}
