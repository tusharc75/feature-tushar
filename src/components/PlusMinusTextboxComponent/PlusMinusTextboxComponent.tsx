import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Grid, TextField } from '@mui/material';
import NumberFormat from 'react-number-format';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { generateUniqueId } from '../../constants/helpers';

interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const CustomFormat = (props: NumberFormatCustomProps | any) => {
  const { inputRef, onChange, ...other } = props;
  return <NumberFormat {...other} getInputRef={inputRef} isNumericString />;
};

function PlusMinusTextboxComponent({ inputTextLabel, value, minValue = 1, isRequired = false, onChange, allowDecimal = false }) {
  const inputNumberRef = useRef(null);
  const uniqueId = generateUniqueId();

  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const ignoreScroll = (e) => {
      e.preventDefault();
    };
    inputNumberRef.current && inputNumberRef.current.addEventListener('wheel', ignoreScroll);
  }, [inputNumberRef]);

  return (
    <Grid container spacing={1} alignItems="flex-end" className="flex-no-wrap">
      <Grid item>
        <IconButton
          color="primary"
          disabled={parseInt(inputValue) === minValue}
          onClick={() => {
            setInputValue((prevState) => parseInt(prevState) - 1);
          }}
          size="small"
        >
          <RemoveCircleOutlineOutlinedIcon />
        </IconButton>
      </Grid>
      <Grid item xs={10}>
        <TextField
          fullWidth
          id={uniqueId}
          name={uniqueId}
          label={inputTextLabel}
          ref={inputNumberRef}
          value={inputValue}
          slots={{ input: CustomFormat }}
          slotProps={{
            input: {
              inputProps: {
                allowNegative: false,
                min: minValue,
                onValueChange: (values) => {
                  if ((isRequired === true && values.value === '') || parseInt(values.value) < minValue) {
                    setInputValue(minValue?.toString());
                  } else {
                    if (allowDecimal) {
                      onChange(values.value);
                      setInputValue(values.value?.toString());
                    } else {
                      const value = values.value.replace(/[^0-9]/g, '');
                      onChange(value);
                      setInputValue(value?.toString());
                    }
                  }
                }
              }
            }
          }}
        />
      </Grid>
      <Grid item>
        <IconButton
          color="primary"
          onClick={() => {
            setInputValue((prevState) => parseInt(prevState) + 1);
          }}
          size="small"
        >
          <AddCircleOutlineOutlinedIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}

export default PlusMinusTextboxComponent;
