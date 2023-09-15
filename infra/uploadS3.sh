export AWS_PROFILE=pmat-dev-1

# TODO: add cache control
aws s3 cp dist/pmat-org-root-config.js     s3://eu-west-1-ssr
aws s3 cp dist/pmat-org-root-config.js.map s3://eu-west-1-ssr

