const { describe, it } = require('mocha');
const assert = require('assert');
const GitHubApi = require('./GitHubApi');

describe('GitHubApi', () => {
  describe('Request Github for latest release', () => {
    it('Should return status code 200 OK', () => {
      GitHubApi.getLatestRelease()
        .then((response) => {
          assert.equal(200, response.statusCode);
        })
        .catch(error => console.error(error));
    });
  });
  describe('Request Github for latest version number', () => {
    it('Should return the latest version number', () => {
      GitHubApi.getLatestVersion()
        .then((result) => {
          assert.equal('v0.1.4', result);
        })
        .catch(error => console.error(error));
    });
  });
});
