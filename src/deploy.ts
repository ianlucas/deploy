/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { NodeSSH } from "node-ssh";
import { backup } from "./backup.js";
import type { DeployApp, DeployConfig } from "./load.js";
import { args } from "./process.js";
import { zip } from "./zip.js";

export async function deploy(config: DeployConfig, app: DeployApp, backupFileName?: string) {
    const { name } = app;
    const deployPath = `/opt/${name}-deploying`;
    const appPath = `/opt/${name}`;

    const { zipFileName, zipFile } = await (backupFileName !== undefined ? backup(backupFileName) : zip(config, app));

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
        const ssh = new NodeSSH();
        const externalZipFile = `/home/${zipFileName}`;

        await ssh.connect({
            host: config.ssh.host,
            username: config.ssh.username,
            password: config.ssh.password
        });

        await ssh.putFile(zipFile, externalZipFile);
        console.log("uploaded deploy file");

        await ssh.execCommand(`mkdir -p ${deployPath}`);
        await ssh.execCommand(`rm -rf ${deployPath}/{..?*,.[!.]*,*}`);

        await ssh.execCommand(`unzip ${externalZipFile} -d ${deployPath}`);
        console.log("extracted deploy file");

        console.log("installing dependencies...");
        await ssh.execCommand("npm ci", {
            cwd: deployPath
        });
        console.log("installed dependencies");

        await ssh.execCommand("npx prisma migrate deploy", {
            cwd: deployPath
        });
        console.log("migrated database schema");

        if (!args["--noprocess"]) {
            await ssh.execCommand(`pm2 stop ${name}`);
            console.log("stopped the server");
        }

        await ssh.execCommand(`[ -d "${appPath}" ] && rm -rf ${appPath}`);
        console.log("deleted old server data");

        await ssh.execCommand(`mv ${deployPath} ${appPath}`);
        console.log("moved new server data");

        if (!args["--noprocess"]) {
            await ssh.execCommand(`pm2 start ${name}`);
            console.log("started the server");
        }

        console.log("deployment complete");
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
