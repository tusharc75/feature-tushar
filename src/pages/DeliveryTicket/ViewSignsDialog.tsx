import { useState, useEffect } from 'react'
import { Dialog, Button, Box, Grid, Typography } from "@material-ui/core"
import { startCase } from 'lodash'
import moment from "moment";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent"
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter"
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader"
import { CustomDialogTransition, dateFormat, dateTimeFormat } from "../../constants/helpers"


const ViewSignsDialog = ({ close, signatures }) => {

  const [signs, setSigns] = useState([]);

  useEffect(() => {
    if (signatures) {
      let newSigns = [];
      for (const s of signatures) {
        if (!newSigns.includes(s.status)) {
          newSigns.push(s.status)
        }
      }
      newSigns = newSigns.map(status => {
        const signGroup = signatures.filter((d: any) => d.status === status);
        return {
          status,
          signs: signGroup
        }
      })
      setSigns(newSigns)
    }
  }, [signatures])

  return (
    <Dialog TransitionComponent={CustomDialogTransition} maxWidth="md" open fullWidth onClose={close} >
      <CustomDialogHeader title="Signatures" onClose={close} />
      <CustomDialogContent>
        <Grid container spacing={2}>
          {signs.map(sign => (
            <Grid item xs={12} sm={6}>
              <Box textAlign="center">
                <Typography variant='body1' >"{sign.status === "Start Delivery" ? "Sign-off - Dispatched" : "Sign-off - Delivered"}"&nbsp;
                  {sign?.signs && sign.signs.length > 1 && sign.signs[1].date ? moment(sign.signs[1].date).format(dateTimeFormat) : ""}</Typography>
              </Box>
              <Box mt={4}>
                <Grid container spacing={2} justifyContent='center'>
                  {sign.signs.map(s => (
                    <Grid item>
                      <Box textAlign="center" maxWidth={160}>
                        <Typography variant='body2' >{startCase(s.type)} Sign</Typography>
                        <Box my={2} />
                        {s.name && <Typography variant='body2' >{s.name}</Typography>}
                        <Box my={2} />
                        <img width="100%" src={s.signature} alt={startCase(s.type)} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" variant="outlined" onClick={close} color='primary'>Close</Button>
      </CustomDialogFooter>
    </Dialog>
  )
}

export default ViewSignsDialog
