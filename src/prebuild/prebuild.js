const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

let apiUrl = `${process.env.VITE_APP_API_URL}/portal-version`;
let method = 'POST';

if(process.env.VITE_APP_ENV === 'production') {
  apiUrl += `/auto-update-new-version`;
} else {
  apiUrl += `/latest`;
  method = 'GET';
}

fetch(apiUrl, {
  method: method,
  headers: {
    'Content-Type': 'application/json',
  },
  body: method === 'POST' ? JSON.stringify({}) : undefined,
})
  .then((response) => response.json())
  .then((data) => {
    if (data?.data && data?.data?.version) {
      fs.writeFileSync('src/prebuild/prebuildData.json', JSON.stringify(data.data));
    }
  })
  .catch((error) => console.error('Error fetching data:', error));
