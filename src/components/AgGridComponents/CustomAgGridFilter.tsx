// import React, {
//     forwardRef,
//     Fragment,
//     useImperativeHandle,
//     useRef,
//     useState,
// } from 'react';
// import { TextField } from "@material-ui/core";

// export default forwardRef((props: any, ref) => {
//     const inputRef = useRef(null);

//     // expose AG Grid Filter Lifecycle callbacks
//     useImperativeHandle(ref, () => {
//         return {
//             onParentModelChanged(parentModel) {
//                 // When the filter is empty we will receive a null value here
//                 if (!parentModel) {
//                     inputRef.current.value;
//                 } else {
//                     inputRef.current.value = parentModel;
//                 }
//             },
//         };
//     });

//     const onInputBoxChanged = (input) => {
//         const value = input.target.value;
//         if (value === '') {
//             // Remove the filter
//             props.parentFilterInstance((instance) => {
//                 instance
//                     .getFrameworkComponentInstance()
//                     .myMethodForTakingValueFromFloatingFilter(null);
//             });
//             return;
//         }

//         props.parentFilterInstance((instance) => {
//             instance
//                 .getFrameworkComponentInstance()
//                 .myMethodForTakingValueFromFloatingFilter(value);
//         });
//     };

//     return (
//         <Fragment>
//             <TextField ref={inputRef} onChange={onInputBoxChanged} />
//         </Fragment>
//     );
// });

import { TextField } from "@material-ui/core";
import React, { forwardRef, Fragment, useImperativeHandle, useRef, useState } from "react";

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

    const onInputBoxChanged = input => {
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
    }

    return (
        <Fragment>
            <TextField ref={inputRef} onChange={onInputBoxChanged} />
        </Fragment>
    );
});