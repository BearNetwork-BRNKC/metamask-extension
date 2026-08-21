export const MODES = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
} as const;

/**
 * The build environment. This describes the environment this build was produced in.
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  OTHER: 'other',
  PRODUCTION: 'production',
  PULL_REQUEST: 'pull-request',
  RELEASE_CANDIDATE: 'release-candidate',
  STAGING: 'staging',
  TESTING: 'testing',
} as const;

// Manifest key used for non-production Chrome builds to keep a stable
// extension ID for OAuth flows.
export const CHROME_MANIFEST_KEY_NON_PRODUCTION =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwNlU3PeDRWSQno6bkimgan5C3JEJoF9evkwr2sZvmdoKLw+DBqfg3CZXUffIexFf4PCoRmPA0ze0W46ngfmBT1oVlNjUKrG//0Zbz/eCjeICwTUJ7sGwGOUBc2CoNURwc1MypAuZRbqIy2whkV8QnXrxH0gNr763GALGbdxmEJJF6qtVw3XZ80s/L4Jor4V9ODTZdb+HZzoTouqf33q0XWUdWd7CkjNRGctV0uYxwKu5JlJWoB3/szZTwp+RCJG54LJ0r1WIjW2PbVphfuAGHRkXk4QAoDSolWz3rzAZyAcDR904++Wri7WPSU0SUMLnDRJ3oaT91qLnJn55GbsfLQIDAQAB';

// Only used for Chrome builds produced from the release-candidate branch.
export const CHROME_MANIFEST_KEY_RELEASE_CANDIDATE =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlcgI4VVL4JUvo6hlSgeCZp9mGltZrzFvc2Asqzb1dDGO9baoYOe+QRoh27/YyVXugxni480Q/R147INhBOyQZVMhZOD5pFMVutia9MHMaZhgRXzrK3BHtNSkKLL1c5mhutQNwiLqLtFkMSGvka91LoMEC8WTI0wi4tACnJ5FyFZQYzvtqy5sXo3VS3gzfOBluLKi7BxYcaUJjNrhOIxl1xL2qgK5lDrDOLKcbaurDiwqofVtAFOL5sM3uJ6D8nOO9tG+T7hoobRFN+nxk43PHgCv4poicOv+NMZQEk3da1m/xfuzXV88NcE/YRbRLwAS82m3gsJZKc6mLqm4wZHzBwIDAQAB';

/**
 * Collection of variable declarations required for the production build.
 * Grouped by build type.
 */
export const VARIABLES_REQUIRED_IN_PRODUCTION = {
  main: [
    'INFURA_PROD_PROJECT_ID',
    'SEGMENT_PROD_WRITE_KEY',
    'SENTRY_DSN',
    'QUICKNODE_MAINNET_URL',
    'QUICKNODE_LINEA_MAINNET_URL',
    'QUICKNODE_ARBITRUM_URL',
    'QUICKNODE_AVALANCHE_URL',
    'QUICKNODE_OPTIMISM_URL',
    'QUICKNODE_POLYGON_URL',
    'QUICKNODE_BASE_URL',
    'QUICKNODE_SEI_URL',
  ],
  beta: ['INFURA_BETA_PROJECT_ID', 'SEGMENT_BETA_WRITE_KEY', 'SENTRY_DSN'],
  experimental: [
    'INFURA_EXPERIMENTAL_PROJECT_ID',
    'SEGMENT_EXPERIMENTAL_WRITE_KEY',
    'SENTRY_DSN',
  ],
  flask: ['INFURA_FLASK_PROJECT_ID', 'SEGMENT_FLASK_WRITE_KEY', 'SENTRY_DSN'],
};
