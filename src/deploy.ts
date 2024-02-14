/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { backup } from "./backup.js";
import type { DeployApp, DeployConfig } from "./load.js";
import { args } from "./process.js";
import { ssh } from "./ssh.js";
import { zip } from "./zip.js";

export async function deploy(config: DeployConfig, app: DeployApp) {
    const { name } = app;
    const deployPath = `/opt/${name}-deploying`;
    const appPath = `/opt/${name}`;

    const { zipFileName, zipFile } = await (args["--backup"] !== undefined
        ? backup(args["--backup"])
        : zip(config, app));

    if (args["--debug"]) {
        console.log({
            name,
            deployPath,
            appPath,
            zipFileName,
            zipFile
        });
        process.exit(0);
    }

    try {
        const $ = await ssh(config.ssh);
        const externalZipFile = `/home/${zipFileName}`;
        const deployPathCwd = { cwd: deployPath };

        await $.putFile(zipFile, externalZipFile);
        console.log("uploaded deploy file");

        await $(`mkdir -p ${deployPath}`);
        await $(`rm -rf ${deployPath}/{..?*,.[!.]*,*}`);

        await $(`unzip ${externalZipFile} -d ${deployPath}`);
        console.log("extracted deploy file");

        console.log("installing dependencies...");
        await $("npm ci", deployPathCwd);
        console.log("installed dependencies");

        await $("npx prisma migrate deploy", deployPathCwd);
        console.log("migrated database schema");

        if (!args["--no-pm2"]) {
            await $(`pm2 stop ${name}`);
            console.log("stopped the server");
        }

        await $(`[ -d "${appPath}" ] && rm -rf ${appPath}`);
        console.log("deleted old server data");

        await $(`mv ${deployPath} ${appPath}`);
        console.log("moved new server data");

        if (config.afterDeploy !== undefined) {
            await config.afterDeploy({ $, name, deployPathCwd });
        }

        if (!args["--no-pm2"]) {
            await $(`pm2 start ${name}`);
            console.log("started the server");
        }

        console.log("deployment complete");
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
