import { Dialog, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, dateFormat } from 'src/constants/helpers';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import { camelCase, capitalize } from 'lodash';

const ChangesDialog = ({ open, onClose, changes, operations }) => {

  const [fullScreen, setFullScreen] = useState(true);

  console.log(operations)

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
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
          {changes?.length ? (
            <TableContainer component={Paper}>
              <Table aria-label="customized table">
                <TableHead>
                  <TableRow>
                    <TableCell>Field Name</TableCell>
                    <TableCell>Old Value</TableCell>
                    <TableCell>New Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changes?.map((data: any, index: any) => {
                    return (
                      data?.fieldLabel && (
                        <TableRow key={index}>
                          <TableCell>{data?.fieldLabel}</TableCell>
                          <TableCell>
                            {data?.oldValue ? (
                              data?.type === 'date' ? (
                                moment(data?.oldValue).format(dateFormat)
                              ) : data?.type === 'dropDown' && data?.lookup ? (
                                <Link
                                  className="link text-truncate"
                                  title={data?.oldValue?.label}
                                  to={`${routes[`${camelCase(data?.lookup_resource)}Detail`]?.path}/${data?.oldValue?.value}`}
                                >
                                  {data?.oldValue?.label}
                                </Link>
                              ) : (
                                data?.oldValue
                              )
                            ) : (
                              <NoDataCell />
                            )}
                          </TableCell>
                          <TableCell>
                            {data?.newValue ? (
                              data?.type === 'date' ? (
                                moment(data?.newValue).format(dateFormat)
                              ) : data?.type === 'dropDown' && data?.lookup ? (
                                <Link
                                  className="link text-truncate"
                                  title={data?.newValue?.label}
                                  to={`${routes[`${camelCase(data?.lookup_resource)}Detail`]?.path}/${data?.newValue?.value}`}
                                >
                                  {data?.newValue?.label}
                                </Link>
                              ) : (
                                data?.newValue
                              )
                            ) : (
                              <NoDataCell />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
          {operations?.length ?
            <TableContainer component={Paper}>
              <Table aria-label="customized table">
                <TableHead>
                  <TableRow>
                    <TableCell>Operation</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Changes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {operations?.map((o: any, index: any) => {
                    return (
                      <TableRow key={index}>
                        <TableCell>{capitalize(o?.type)}</TableCell>
                        <TableCell>{`${o?.label} (${capitalize(o?.referenceType)})`}</TableCell>
                        <TableCell>
                          {o?.changes?.length ?
                            <TableContainer component={Paper}>
                              <Table aria-label="customized table">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Field Name</TableCell>
                                    <TableCell>Old Value</TableCell>
                                    <TableCell>New Value</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {o?.changes?.map((data: any, index: any) => {
                                    return (data?.fieldLabel && (
                                      <TableRow key={index}>
                                        <TableCell>{data?.fieldLabel}</TableCell>
                                        <TableCell>
                                          {data?.oldValue ? (
                                            data?.type === 'date' ? (
                                              moment(data?.oldValue).format(dateFormat)
                                            ) : data?.type === 'dropDown' && data?.lookup ? (
                                              <Link
                                                className="link text-truncate"
                                                title={data?.oldValue?.label}
                                                to={`${routes[`${camelCase(data?.lookup_resource)}Detail`]?.path}/${data?.oldValue?.value}`}
                                              >
                                                {data?.oldValue?.label}
                                              </Link>
                                            ) : (
                                              data?.oldValue
                                            )
                                          ) : (
                                            <NoDataCell />
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {data?.newValue ? (
                                            data?.type === 'date' ? (
                                              moment(data?.newValue).format(dateFormat)
                                            ) : data?.type === 'dropDown' && data?.lookup ? (
                                              <Link
                                                className="link text-truncate"
                                                title={data?.newValue?.label}
                                                to={`${routes[`${camelCase(data?.lookup_resource)}Detail`]?.path}/${data?.newValue?.value}`}
                                              >
                                                {data?.newValue?.label}
                                              </Link>
                                            ) : (
                                              data?.newValue
                                            )
                                          ) : (
                                            <NoDataCell />
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                            :
                            <NoDataCell />
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            : null}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ChangesDialog;
