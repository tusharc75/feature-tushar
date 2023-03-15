import React, { forwardRef, Fragment, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { TextField } from '@material-ui/core';
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
    };
  });

  let timeout;
  const onInputBoxChanged = (input) => {
    let millisec = Object.keys(input.target.value).length > 0 ? 600 : 5;
    setCurrentValue(input.target.value);

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      if (input.target.value === '') {
        // clear the filter
        props.parentFilterInstance((instance) => {
          instance.onFloatingFilterChanged(null, null);
        });
        return;
      }

      props.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged('contains', input.target.value);

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
  };

  return (
    <Fragment>
      <TextField
        style={{ padding: 0 }}
        type="search"
        ref={inputRef}
        value={currentValue}
        onChange={onInputBoxChanged}
        size="small"
        fullWidth
        InputProps={{
          startAdornment: <FilterListIcon fontSize="small" className="mr-2" />
        }}
      />
    </Fragment>
  );
});

// import React, { forwardRef, Fragment, useImperativeHandle, useRef, useState, useEffect } from 'react';
// import { IconButton, TextField } from '@material-ui/core';
// import FilterListIcon from '@material-ui/icons/FilterList';

// import { CgSearch } from 'react-icons/cg';
// import { GrFormClose } from 'react-icons/gr';

// export default forwardRef((props: any, ref) => {
//   const [currentValue, setCurrentValue] = useState(null);
//   const [isOpen, setIsOpen] = useState(false);
//   const inputRef = useRef(null);
//   const containerRef = React.useRef(null);

//   // Show Hide search
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (containerRef.current && !containerRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [containerRef]);

//   useEffect(() => {
//     if (isOpen) {
//       inputRef.current.focus();
//     }
//   }, [isOpen]);

//   // expose AG Grid Filter Lifecycle callbacks
//   useImperativeHandle(ref, () => {
//     return {
//       onParentModelChanged(parentModel) {
//         // When the filter is empty we will receive a null value here
//         if (!parentModel) {
//           inputRef.current.value = '';
//           setCurrentValue(null);
//         } else {
//           inputRef.current.value = parentModel.filter + '';
//           setCurrentValue(parentModel.filter);
//         }
//       }
//     };
//   });

//   let timeout;
//   const onInputBoxChanged = (input) => {
//     let millisec = Object.keys(input.target.value).length > 0 ? 600 : 5;

//     if (timeout) {
//       clearTimeout(timeout);
//     }

//     timeout = setTimeout(() => {
//       if (input.target.value === '') {
//         // clear the filter
//         props.parentFilterInstance((instance) => {
//           instance.onFloatingFilterChanged(null, null);
//         });
//         return;
//       }

//       // setCurrentValue(input.target.value);
//       props.parentFilterInstance((instance) => {
//         instance.onFloatingFilterChanged('contains', input.target.value);
//       });
//     }, millisec);
//   };

//   const clearFilter = () => {
//     props.parentFilterInstance((instance) => {
//       instance.onFloatingFilterChanged(null, null);
//     });
//     setCurrentValue('');
//   };

//   return (
//     <Fragment>
//       {/* <TextField
//         style={{ padding: 0 }}
//         type="search"
//         ref={inputRef}
//         onChange={onInputBoxChanged}
//         size="small"
//         fullWidth
//         InputProps={{
//           startAdornment: <FilterListIcon fontSize="small" className="mr-2" />
//         }}
//       /> */}

//       <div>
//         <IconButton onClick={() => setIsOpen(true)} size="small" className={`${currentValue ? 'activeFilter' : ''}`}>
//           <CgSearch />
//         </IconButton>
//         <div className={`tableFilterSearch ${isOpen ? 'open' : ''}`} ref={containerRef}>
//           <input
//             value={currentValue || ''}
//             ref={inputRef}
//             onChange={(e) => {
//               setCurrentValue(e.target.value);
//               onInputBoxChanged(e);
//             }}
//             autoComplete="off"
//             placeholder="Search..."
//             type="text"
//             id="search"
//             aria-hidden={!isOpen}
//           />
//           <GrFormClose
//             onClick={() => {
//               clearFilter();
//               setIsOpen(false);
//             }}
//           />
//         </div>
//       </div>
//     </Fragment>
//   );
// });
