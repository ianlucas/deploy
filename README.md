# deploy

> My simple deployment script

## Usage

> [!IMPORTANT]  
> Set up a `deploy.js` at the root of the project, see `/deploy.example.js` as a reference.

```sh
npx @ianlucas/deploy@latest
```

### Options

-   `--all` or `-a`: deploy all apps listed in `deploy.js`.
-   `--backup <filename>` or `-b`: name of the file in `/deploys` to be deployed.
-   `--no-pm2`: script won't mess with `pm2`.
-   `--debug`: display deployment information, apps won't be deployed.
