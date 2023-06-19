const path = require('path');
const { upload } = require('sentry-files');
const { version } = require('./package.json');
require('dotenv').config();

function getFiles() {
  const BUILD_DIR = 'build';
  const assetsFile = path.resolve(BUILD_DIR, 'asset-manifest.json');
  const filePaths = require(assetsFile);
  const jsFilesRegex = /(\.js(.map)?)$/;
  const files = Object.keys(filePaths.files)
    .filter((f) => jsFilesRegex.test(f))
    .map((f) => ({
      name: `~/${filePaths.files[f]}`,
      path: `${path.join('./build', path.resolve(BUILD_DIR, filePaths.files[f]))}`
    }));
  return files;
}

upload({
  version: version,
  organization: import.meta.env.ERROR_REPORTING_ORGANIZATION,
  project: import.meta.env.ERROR_REPORTING_PROJECT,
  token: import.meta.env.ERROR_REPORTING_API_TOKEN,
  files: getFiles()
})
  .then((data) => console.log('----- SUCCESS ----\n', data))
  .catch((error) => console.log('---- ERROR ----\n', error));
