import React, { forwardRef, Fragment, useImperativeHandle, useRef, useState } from "react";
import { TextField } from "@material-ui/core";
import FilterListIcon from '@material-ui/icons/FilterList';

export default forwardRef((props: any, ref) => {
    const [currentValue, setCurrentValue] = useState(null);
    const inputRef = useRef(null);

    // expose AG Grid Filter Lifecycle callbacks
    useImperativeHandle(ref, () => {
        return {
            onParentModelChanged(parentModel) {
                // When the filter is empty we will receive a null value here
                if (!parentModel) {
                    inputRef.current.value = '';
                    setCurrentValue(null);
                } else {
                    inputRef.current.value = parentModel.filter + '';
                    setCurrentValue(parentModel.filter);
                }
            }
        }
    });

    let timeout;
    const onInputBoxChanged = input => {
        let millisec = Object.keys(input.target.value).length > 0 ? 600 : 5;

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {

            if (input.target.value === '') {
                // clear the filter
                props.parentFilterInstance(instance => {
                    instance.onFloatingFilterChanged(null, null);
                });
                return;
            }

            setCurrentValue(input.target.value);
            props.parentFilterInstance(instance => {
                instance.onFloatingFilterChanged("contains", input.target.value);

                // instance
                //     .getFrameworkComponentInstance()
                //     .myCustomFilter(input.target);

                // props.customFunction(props.field, "contains", input.target.value)
                // instance.onFloatingFilterChanged("contains", input.target.value)

                // instance
                // .getFrameworkComponentInstance()
                // .onParentModelChanged()

                // .customFunction(input.target.value)
                // props.onCustomFilter(props.field, "contains", input.target.value);
                // instance.onFloatingFilterChanged("contains", input.target.value);
            });
        }, millisec);
    }

    return (
        <Fragment>
            <TextField
                style={{ padding: 0 }}
                type="search"
                ref={inputRef}
                onChange={onInputBoxChanged}
                size="small"
                InputProps={{
                    startAdornment: <FilterListIcon fontSize="small" className="mr-2" />,
                }}
            />
        </Fragment>
    );
});