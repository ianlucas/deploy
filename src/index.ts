#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import AdmZip from "adm-zip";
import { existsSync } from "fs";
import { NodeSSH } from "node-ssh";
import { resolve } from "path";
import { $ } from "zx";
import { z } from "zod";
import arg from "arg";

const args = arg({
    "--backup": String,
    "--noprocess": Boolean,
    "--debug": Boolean,

    "-b": "--backup",
    "-n": "--noprocess"
});

const cwd = process.cwd();

async function load() {
    return z
        .object({
            ssh: z.object({
                host: z.string(),
                username: z.string(),
                password: z.string()
            }),
            apps: z
                .array(
                    z.object({
                        name: z.string(),
                        folders: z.array(z.string()),
                        files: z.array(z.string()),
                        env: z.record(z.string().or(z.number()))
                    })
                )
                .min(1),
            beforeZip: z.function().optional()
        })
        .parse((await import(`file://${cwd}/deploy.js`)).default);
}

export type DeployConfig = Awaited<ReturnType<typeof load>>;
type DeployApp = DeployConfig["apps"][number];

function envToString(env: Record<string, string | number>) {
    return Object.entries(env)
        .map(([key, value]) => `${key}=${typeof value === "string" ? `"${value}"` : value}`)
        .join("\n");
}

async function zip({ beforeZip: beforePackage }: DeployConfig, { name, folders, files, env }: DeployApp) {
    if (beforePackage !== undefined) {
        await beforePackage({
            $,
            name
        });
    }

    const timestamp = new Date().toISOString().replace("Z", "").replace(/[^\d]/g, "-");

    const zipFileName = `${name}-${timestamp}.zip`;
    const deploysPath = resolve(cwd, "deploys");
    const zipFile = resolve(deploysPath, zipFileName);

    if (!existsSync(deploysPath)) {
        await $`mkdir ${deploysPath}`;
    }

    const zip = new AdmZip();

    folders.forEach((folder) => zip.addLocalFolder(resolve(cwd, folder), folder));
    files.forEach((file) => zip.addLocalFile(resolve(cwd, file), "/"));
    zip.addFile(".env", Buffer.from(envToString(env)));

    zip.writeZip(zipFile);
    console.log("created deployment zip file");

    return {
        zipFileName,
        zipFile
    };
}

function backup(zipFileName: string) {
    const zipFile = resolve(cwd, "deploys", zipFileName);
    if (!existsSync(zipFile)) {
        console.log("backup file not found");
        process.exit(1);
    }
    return {
        zipFileName,
        zipFile
    };
}

async function deploy(config: DeployConfig, app: DeployApp, backupFileName?: string) {
    const { name } = app;
    const deployPath = `/opt/${name}-deploying`;
    const appPath = `/opt/${name}`;

    const { zipFileName, zipFile } = backupFileName !== undefined ? backup(backupFileName) : await zip(config, app);

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

async function main() {
    const config = await load();
    let [name] = args._;

    if (!config.ssh.host || !config.ssh.username || !config.ssh.password) {
        console.log("make sure to add host, username, and password to deploy.json");
        process.exit(1);
    }

    if (!name && config.apps.length > 1) {
        console.log("please specify an app to deploy");
        process.exit(1);
    }

    name = name !== undefined ? name : config.apps[0].name;

    if (name === "all") {
        if (args["--backup"] !== undefined) {
            console.log("backup file name is ignored when deploying all apps");
        }
        for (const app of config.apps) {
            await deploy(config, app);
        }
    } else {
        const app = config.apps.find((app) => app.name === name);
        if (!app) {
            console.log(`app ${name} not found`);
            process.exit(1);
        }
        await deploy(config, app, args["--backup"]);
    }
}

main();
