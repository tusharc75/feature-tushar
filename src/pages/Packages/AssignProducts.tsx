import { useContext, useEffect, useState, Fragment } from 'react';
import { Dialog, Box, TextField, CircularProgress } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, packages } from '../../constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const AssingProductsDialog = (props) => {
  const { packageIds, onClose, onSuccess } = props;
  const { setToastConfig } = useContext(CustomToastContext);
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    (() => {
      setLoading(true);
      axiosInstance()
        .get(`/product?limit=0`)
        .then(({ data: { data } }) => {
          const products = data.map((_d) => ({ id: _d._id, name: _d.productName }));
          setProducts(products);
          setLoading(false);
        })
        .catch((err) => {
          setToastConfig(err);
          setLoading(false);
        });
    })();
  }, []);

  const submitForm = () => {
    setSubmitting(true);
    axiosInstance()
      .post(`${packages.api}/material`, {
        ids: packageIds,
        products: [{ product: product.id, qty }]
      })
      .then(() => {
        setSubmitting(false);
        onSuccess();
      })
      .catch((err) => {
        setSubmitting(false);
        setToastConfig(err);
      });
  };

  return (
    <Dialog open fullWidth TransitionComponent={CustomDialogTransition} maxWidth="sm" onClose={onClose}>
      <CustomDialogHeader title="Assign To Product" onClose={onClose} />
      <CustomDialogContent>
        <Box p={2}>
          <Autocomplete
            fullWidth
            size="small"
            options={products}
            value={product}
            getOptionLabel={(option) => option?.name}
            onChange={(_, val) => {
              setProduct(val);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <Fragment>
                        {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </Fragment>
                    )
                  }
                }}
                variant="outlined"
                required
                label="Select Product"
                size="small"
              />
            )}
          />

          <Box my={4} />
          <TextField
            size="small"
            fullWidth
            value={qty}
            type="number"
            onChange={(e) => setQty(parseInt(e.target.value))}
            variant="outlined"
            required
            label="Quantity"
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton
          onClick={onClose}
          buttonType='transparent'
        >
          Cancel
        </ThemeButton>
        <ThemeButton
          onClick={submitForm}
          buttonType='theme'
          disabled={isSubmitting || !Boolean(product) || !Boolean(qty)}
          isLoading={isSubmitting}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssingProductsDialog;
