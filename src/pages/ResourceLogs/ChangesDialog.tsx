import { Dialog, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { Fragment, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Link } from 'react-router-dom';
import routes from "src/components/Helpers/Routes";

const ChangesDialog = ({ open, onClose, changes }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={open}
      fullWidth
    >
      <CustomDialogHeader
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
        title={`Changes`}
        onClose={onClose}
      />
      <CustomDialogContent>
        <div className="p-3">
          <TableContainer component={Paper}>
            <Table aria-label="customized table">
              <TableHead>
                <TableRow>
                  <TableCell>Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {changes && changes?.changes?.map((item: any, index: any) => {

                  if (changes?.data[index]?.lookup) {
                    
                    const lookup_resource = changes?.data[index]?.lookup_resource?.replaceAll(' ', '');
                    const route = `${lookup_resource.charAt(0).toLowerCase() + lookup_resource.slice(1)}Detail`

                    item = <Fragment>{changes?.data[index]?.fieldLabel} changed { }
                      {changes?.data[index]?.oldValue && <>
                        from { }
                        <Link className="link text-truncate"
                          title={changes?.data[index]?.oldValue?.label} to={`${routes[route].path}/${changes?.data[index]?.oldValue?.value}`}>
                          {changes?.data[index]?.oldValue?.label}
                        </Link>
                      </>
                      }
                      to { }
                      <Link className="link text-truncate"
                        title={changes?.data[index]?.oldValue?.label} to={`${routes[route].path}/${changes?.data[index]?.newValue?.value}`}>
                        {changes?.data[index]?.newValue?.label}
                      </Link>
                    </Fragment>
                  }

                  return (
                    <TableRow key={index}>
                      <TableCell>{item}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </CustomDialogContent >
    </Dialog >
  );
};

export default ChangesDialog;
