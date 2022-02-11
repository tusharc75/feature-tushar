import { Grid } from '@material-ui/core';
import { camelCase } from 'lodash';
import React from 'react';
import axiosInstance from '../../axios/axiosInstance';

import CustomContainer from '../../components/CustomContainer';
import routes from '../../components/Helpers/Routes';
import { useData } from '../../StateProvider/Provider';
import ChartTypes from './ChartTypes';
import seed from './seed';
import countriesData from "../../constants/Country.json"

const DashbaordNew = () => {
  const {
    state: { selectedEntity }
  } = useData();
  const [filtersOptions, setFilterOptions] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const {
          data: { data }
        } = await axiosInstance().get(`sa-formbuilder/lookup?lookupResource=Product Category,Market Segment,Customer Account,User`);
        if (!data) return;

        Object.keys(data).forEach((_d) => {
          setFilterOptions((prevState) => ({
            ...prevState,
            countryBillTo: countriesData,
            countrySellTo: countriesData,
            [camelCase(_d) === 'user' ? 'salesRep' : camelCase(_d)]: data[_d]
          }));
        });

        //console.log(data);
      } catch (error) {
        alert(JSON.stringify(error));
      }
    })();
  }, []);

  // const fetchProductCategory = () => {
  //   axiosInstance()
  //     .get(`${routes.productCategory.path}?limit=0`)
  //     .then(({ data: { data } }) => {
  //       // setProductCategory(data.map((d) => ({ id: d._id, name: d.name })));
  //     })
  //     .catch((err) => {});
  // };

  // const fetchMarketSegment = () => {
  //   axiosInstance()
  //     .get(`${routes.marketSegment.path}?limit=0`)
  //     .then(({ data: { data } }) => {
  //       data = data.map((d) => ({
  //         id: d.id,
  //         name: d.name,
  //         parentSegment: d?.parentMarketSegment?.optionValue
  //       }));
  //       // setMarketSegments(data);
  //     })
  //     .catch((err) => {});
  // };

  // const fetchSalesReps = () => {
  //   axiosInstance()
  //     .get(`/user?filterById=[{"field": "entities.entity", "term": "${selectedEntity}"}]`)
  //     .then(({ data: { data } }) => {
  //       data = data.map((d) => ({
  //         id: d._id,
  //         name: d.concatedName
  //       }));
  //       // setSalesReps(data);
  //     })
  //     .catch((err) => {});
  // };
  // const fetchCustomerAccount = () => {
  //   axiosInstance()
  //     .get(`${routes.customerAccount.path}?limit=0`)
  //     .then(({ data: { data } }) => {
  //       data = data.map((d) => ({
  //         id: d._id,
  //         name: d.accountName
  //       }));
  //       // setCustomerAccounts(data);
  //     })
  //     .catch((err) => {});
  // };
  return (
    <CustomContainer styles={{padding: 8}}>
      {seed.map((board) => (
        <div key={board.name}>
          <Grid container spacing={2} justifyContent="space-between" alignItems="stretch">
            {board.charts.map((chart, index) => (
              <ChartTypes key={chart.type + ' ' + index + 1} chart={chart} filterData={filtersOptions} />
            ))}
          </Grid>
        </div>
      ))}
    </CustomContainer>
  );
};

export default DashbaordNew;
