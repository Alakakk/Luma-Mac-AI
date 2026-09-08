// Mac distribution is maintained independently; publishing is manual.
const { build } = require('./package.json');
module.exports = {
  ...build,
  appId: 'com.lumatodo.desktop.mactrial',
  productName: 'Luma Mac AI',
  extraResources: [],
  publish: null,
  directories: { output: 'dist-ai' },
  mac: {
    target: ['dir'],
    category: 'public.app-category.productivity',
    identity: null,
  },
};
