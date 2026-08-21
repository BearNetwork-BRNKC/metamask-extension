const ENVIRONMENT = require('../../shared/constants/build-environment.json');

/**
 * The build target. This descrbes the overall purpose of the build.
 *
 * These constants also act as the high-level tasks for the build system (i.e.
 * the usual tasks invoked directly via the CLI rather than internally).
 */
const BUILD_TARGETS = {
  DEV: 'dev',
  DIST: 'dist',
  PROD: 'prod',
  TEST: 'test',
  TEST_DEV: 'testDev',
};

const TASKS = {
  ...BUILD_TARGETS,
  CLEAN: 'clean',
  MANIFEST_DEV: 'manifest:dev',
  MANIFEST_PROD: 'manifest:prod',
  MANIFEST_SCRIPT_DIST: 'manifest:scriptDist',
  MANIFEST_TEST: 'manifest:test',
  MANIFEST_TEST_DEV: 'manifest:testDev',
  RELOAD: 'reload',
  SCRIPTS_CORE_DEV_STANDARD_ENTRY_POINTS:
    'scripts:core:dev:standardEntryPoints',
  SCRIPTS_CORE_DEV_CONTENTSCRIPT: 'scripts:core:dev:contentscript',
  SCRIPTS_CORE_DEV_DISABLE_CONSOLE: 'scripts:core:dev:disable-console',
  SCRIPTS_CORE_DEV_SENTRY: 'scripts:core:dev:sentry',
  SCRIPTS_CORE_DEV_PHISHING_DETECT: 'scripts:core:dev:phishing-detect',
  SCRIPTS_CORE_DIST_STANDARD_ENTRY_POINTS:
    'scripts:core:dist:standardEntryPoints',
  SCRIPTS_CORE_DIST_CONTENTSCRIPT: 'scripts:core:dist:contentscript',
  SCRIPTS_CORE_DIST_DISABLE_CONSOLE: 'scripts:core:dist:disable-console',
  SCRIPTS_CORE_DIST_SENTRY: 'scripts:core:dist:sentry',
  SCRIPTS_CORE_DIST_PHISHING_DETECT: 'scripts:core:dist:phishing-detect',
  SCRIPTS_CORE_PROD_STANDARD_ENTRY_POINTS:
    'scripts:core:prod:standardEntryPoints',
  SCRIPTS_CORE_PROD_CONTENTSCRIPT: 'scripts:core:prod:contentscript',
  SCRIPTS_CORE_PROD_DISABLE_CONSOLE: 'scripts:core:prod:disable-console',
  SCRIPTS_CORE_PROD_SENTRY: 'scripts:core:prod:sentry',
  SCRIPTS_CORE_PROD_PHISHING_DETECT: 'scripts:core:prod:phishing-detect',
  SCRIPTS_CORE_TEST_LIVE_STANDARD_ENTRY_POINTS:
    'scripts:core:test-live:standardEntryPoints',
  SCRIPTS_CORE_TEST_LIVE_CONTENTSCRIPT: 'scripts:core:test-live:contentscript',
  SCRIPTS_CORE_TEST_LIVE_DISABLE_CONSOLE:
    'scripts:core:test-live:disable-console',
  SCRIPTS_CORE_TEST_LIVE_SENTRY: 'scripts:core:test-live:sentry',
  SCRIPTS_CORE_TEST_LIVE_PHISHING_DETECT:
    'scripts:core:test-live:phishing-detect',
  SCRIPTS_CORE_TEST_STANDARD_ENTRY_POINTS:
    'scripts:core:test:standardEntryPoints',
  SCRIPTS_CORE_TEST_CONTENTSCRIPT: 'scripts:core:test:contentscript',
  SCRIPTS_CORE_TEST_DISABLE_CONSOLE: 'scripts:core:test:disable-console',
  SCRIPTS_CORE_TEST_SENTRY: 'scripts:core:test:sentry',
  SCRIPTS_CORE_TEST_PHISHING_DETECT: 'scripts:core:test:phishing-detect',
  SCRIPTS_DIST: 'scripts:dist',
  STATIC_DEV: 'static:dev',
  STATIC_PROD: 'static:prod',
  STYLES: 'styles',
  STYLES_DEV: 'styles:dev',
  STYLES_PROD: 'styles:prod',
  ZIP: 'zip',
};

// manifest key use for development, to get the consistent extension id (required for OAuth)
const MANIFEST_DEV_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwNlU3PeDRWSQno6bkimgan5C3JEJoF9evkwr2sZvmdoKLw+DBqfg3CZXUffIexFf4PCoRmPA0ze0W46ngfmBT1oVlNjUKrG//0Zbz/eCjeICwTUJ7sGwGOUBc2CoNURwc1MypAuZRbqIy2whkV8QnXrxH0gNr763GALGbdxmEJJF6qtVw3XZ80s/L4Jor4V9ODTZdb+HZzoTouqf33q0XWUdWd7CkjNRGctV0uYxwKu5JlJWoB3/szZTwp+RCJG54LJ0r1WIjW2PbVphfuAGHRkXk4QAoDSolWz3rzAZyAcDR904++Wri7WPSU0SUMLnDRJ3oaT91qLnJn55GbsfLQIDAQAB';

// only for builds from the release candidate branch
const MANIFEST_RELEASE_CANDIDATE_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlcgI4VVL4JUvo6hlSgeCZp9mGltZrzFvc2Asqzb1dDGO9baoYOe+QRoh27/YyVXugxni480Q/R147INhBOyQZVMhZOD5pFMVutia9MHMaZhgRXzrK3BHtNSkKLL1c5mhutQNwiLqLtFkMSGvka91LoMEC8WTI0wi4tACnJ5FyFZQYzvtqy5sXo3VS3gzfOBluLKi7BxYcaUJjNrhOIxl1xL2qgK5lDrDOLKcbaurDiwqofVtAFOL5sM3uJ6D8nOO9tG+T7hoobRFN+nxk43PHgCv4poicOv+NMZQEk3da1m/xfuzXV88NcE/YRbRLwAS82m3gsJZKc6mLqm4wZHzBwIDAQAB';

module.exports = {
  BUILD_TARGETS,
  ENVIRONMENT,
  TASKS,
  MANIFEST_DEV_KEY,
  MANIFEST_RELEASE_CANDIDATE_KEY,
};
