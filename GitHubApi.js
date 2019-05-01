
const request = require('request-promise');
const { download } = require('electron-dl');

const GitHubApi = () => {
  const options = {
    url: 'https://api.github.com/repos/rbiggers/electron-pandora/releases/latest',
    headers: {
      'User-Agent': 'request',
    },
    resolveWithFullResponse: true,
  };

  const getLatestRelease = async () => {
    options.method = 'GET';

    try {
      return await request(options);
    } catch (error) {
      throw new Error(error);
    }
  };

  const getLatestVersion = async () => {
    options.method = 'GET';

    try {
      const response = await request(options);
      const version = JSON.parse(response.body).name;
      return version;
    } catch (error) {
      throw new Error(error);
    }
  };

  const downloadLatestVersion = async (window, url) => {
    const downloadOptions = {
      openFolderWhenDone: true,
      showBadge: true,
    };

    try {
      return await download(window, url, downloadOptions);
    } catch (error) {
      throw new Error(error);
    }
  };

  return {
    getLatestRelease,
    getLatestVersion,
    downloadLatestVersion,
  };
};

module.exports = GitHubApi();
