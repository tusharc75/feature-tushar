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
import { useData } from 'src/StateProvider/Provider';

const ChangesDialog = ({ open, onClose, changes, operations, updatedBy }) => {
  const [fullScreen, setFullScreen] = useState(true);
  const {
    state: { permissions }
  }: any = useData();

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
      <CustomDialogContent isFooterPresent={false}>
        <div className="p-3">
          {changes?.length ? (
            <TableContainer component={Paper} elevation={0} className="">
              <Table aria-label="customized table" className="mb-3 [border:1px_solid_var(--common-border-color)]">
                <TableHead>
                  <TableRow>
                    <TableCell scope="col" component={'th'} className="min-w-[200px]">
                      Field Name
                    </TableCell>
                    <TableCell scope="col" component={'th'} className="min-w-[200px]">
                      Old Value
                    </TableCell>
                    <TableCell scope="col" component={'th'} className="min-w-[200px]">
                      New Value
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changes?.map((data: any, index: any) => {
                    return (
                      data?.fieldLabel && (
                        <TableRow key={index}>
                          <TableCell data-th="Field Name">{data?.fieldLabel}</TableCell>
                          <TableCell data-th="Old Value">
                            {data?.oldValue ? (
                              data?.type === 'date' ? (
                                moment(data?.oldValue).format(dateFormat)
                              ) : data?.type === 'dropDown' && data?.lookup ? (
                                <p
                                  className={`${permissions[`${camelCase(data?.lookupResource)}`]?.isRead ? 'link' : ''}text-truncate`}
                                  title={data?.oldValue?.label}
                                  onClick={() => {
                                    if (permissions[`${camelCase(data?.lookupResource)}`]?.isRead)
                                      window.open(`${routes[`${camelCase(data?.lookupResource)}Detail`]?.path}/${data?.oldValue?.value}`);
                                  }}
                                >
                                  {data?.oldValue?.label}
                                </p>
                              ) : data?.type === 'multiSelect' && data?.lookup ? (
                                data?.oldValue?.map((oldValue) => {
                                  return (
                                    <p
                                      className={`${permissions[`${camelCase(data?.lookupResource)}`]?.isRead ? 'link' : ''}text-truncate`}
                                      title={oldValue?.label}
                                      onClick={() => {
                                        if (permissions[`${camelCase(data?.lookupResource)}`]?.isRead)
                                          window.open(`${routes[`${camelCase(data?.lookupResource)}Detail`]?.path}/${oldValue?.value}`);
                                      }}
                                    >
                                      {oldValue?.label}
                                    </p>
                                  )
                                })
                              ) : (
                                data?.oldValue
                              )
                            ) : (
                              <NoDataCell />
                            )}
                          </TableCell>
                          <TableCell data-th="New Value">
                            {data?.newValue ? (
                              data?.type === 'date' ? (
                                moment(data?.newValue).format(dateFormat)
                              ) : data?.type === 'dropDown' && data?.lookup ? (
                                <p
                                  className={`${permissions[`${camelCase(data?.lookupResource)}`]?.isRead ? 'link' : ''} text-truncate`}
                                  title={data?.newValue?.label}
                                  onClick={() => {
                                    if (permissions[`${camelCase(data?.lookupResource)}`]?.isRead)
                                      window.open(`${routes[`${camelCase(data?.lookupResource)}Detail`]?.path}/${data?.newValue?.value}`);
                                  }}
                                >
                                  {data?.newValue?.label}
                                </p>
                              ) : data?.type === 'multiSelect' && data?.lookup ? (
                                data?.newValue?.map((newValue) => {
                                  return (
                                    <p
                                      className={`${permissions[`${camelCase(data?.lookupResource)}`]?.isRead ? 'link' : ''}text-truncate`}
                                      title={newValue?.label}
                                      onClick={() => {
                                        if (permissions[`${camelCase(data?.lookupResource)}`]?.isRead)
                                          window.open(`${routes[`${camelCase(data?.lookupResource)}Detail`]?.path}/${newValue?.value}`);
                                      }}
                                    >
                                      {newValue?.label}
                                    </p>
                                  )
                                })
                              ) :
                                data?.newValue === true ? (
                                  <Typography>True</Typography>
                                ) : data?.newValue === false ? (
                                  <Typography>False</Typography>
                                ) : data?.fieldLabel === 'updatedBy' ? (
                                  `${updatedBy}`
                                ) : Array.isArray(data?.newValue) ? (
                                  data?.newValue?.map((value: any, index: any) => {
                                    return (
                                      <Typography key={index} className="text-truncate">
                                        {value?.product?.optionLabel}
                                      </Typography>
                                    );
                                  })
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
          ) : (
            <NoDataCell />
          )}
          {operations?.length ? (
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
                          {o?.changes?.length ? (
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
                                    return (
                                      data?.fieldLabel && (
                                        <TableRow key={index}>
                                          <TableCell>{data?.fieldLabel}</TableCell>
                                          <TableCell>
                                            {data?.oldValue ? (
                                              data?.type === 'date' ? (
                                                moment(data?.oldValue).format(dateFormat)
                                              ) : data?.type === 'dropDown' && data?.lookup ? (
                                                <p
                                                  className={`${permissions[`${camelCase(data?.lookupResource)}`]?.isRead ? 'link' : ''} text-truncate`}
                                                  title={data?.oldValue?.label}
                                                  onClick={() => {
                                                    if (permissions[`${camelCase(data?.lookupResource)}`]?.isRead)
                                                      window.open(
                                                        `${routes[`${camelCase(data?.lookupResource)}Detail`]?.path}/${data?.oldValue?.value}`
                                                      );
                                                  }}
                                                >
                                                  {data?.oldValue?.label}
                                                </p>
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
                                                <p
                                                  className={`${permissions[`${camelCase(data?.lookupResource)}`]?.isRead ? 'link' : ''} text-truncate`}
                                                  title={data?.newValue?.label}
                                                  onClick={() => {
                                                    if (permissions[`${camelCase(data?.lookupResource)}`]?.isRead)
                                                      window.open(
                                                        `${routes[`${camelCase(data?.lookupResource)}Detail`]?.path}/${data?.newValue?.value}`
                                                      );
                                                  }}
                                                >
                                                  {data?.newValue?.label}
                                                </p>
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
                          ) : (
                            <NoDataCell />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ChangesDialog;
