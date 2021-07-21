const path = require('path');
const { upload } = require('sentry-files');
const { version } = require('./package.json');

function getFiles() {
  const BUILD_DIR = 'build';
  const assetsFile = path.resolve(BUILD_DIR, 'asset-manifest.json');
  const filePaths = require(assetsFile);
  const jsFilesRegex = /(\.js(.map)?)$/;
  return Object.keys(filePaths)
    .filter((f) => jsFilesRegex.test(f))
    .map((f) => ({
      name: `~/${filePaths[f]}`,
      path: path.resolve('build', filePaths[f])
    }));
}

upload({
  version: version,
  organization: 'vebholic-pvt-ltd',
  project: 'om',
  token: '9702b27bd9f64ef29e8d55c7293393617d948d3f8b5841f2b429219da44dc1f5',
  files: getFiles()
})
  .then((data) => console.log('----- SUCCESS ----\n', data))
  .catch((error) => console.log('---- ERROR ----\n', error));
