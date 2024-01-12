# deploy

> My simple deployment script.

## Usage

First, setup a `deploy.js` at the root of the project, see `/deploy.example.js` as a reference.

Then simply:

```sh
npx @ianlucas/deploy
```

# Options

-   `--backup <filename>`: name of the file in `/deploys` to be deployed.
-   `--noprocess` or `-n`: script won't mess with `pm2`.
-   `--backup` or `-b`: display deployment information.
