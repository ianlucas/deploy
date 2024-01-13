/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import AdmZip from "adm-zip";
import { existsSync } from "fs";
import { resolve } from "path";
import { $ } from "zx";
import { Env } from "./env.js";
import type { DeployApp, DeployConfig } from "./load.js";
import { cwd } from "./process.js";

export async function zip({ beforeZip, defaults, merges }: DeployConfig, { name, ...app }: DeployApp) {
    if (beforeZip !== undefined) {
        await beforeZip({
            $,
            name
        });
    }

    const timestamp = new Date().toISOString().replace("Z", "").replace(/[^\d]/g, "-");
    const zipFileName = `${name}-${timestamp}.zip`;
    const deploysPath = resolve(cwd, "deploys");
    const zipFile = resolve(deploysPath, zipFileName);
    const folders = app.files || defaults?.files;
    const files = app.folders || defaults?.folders;
    const env = { ...(merges?.env || {}), ...(app.env || {}) };

    if (folders === undefined && files === undefined) {
        console.log("no files or folders to zip");
        process.exit(1);
    }

    if (!existsSync(deploysPath)) {
        await $`mkdir ${deploysPath}`;
    }

    const zip = new AdmZip();

    folders?.forEach((folder) => zip.addLocalFolder(resolve(cwd, folder), folder));
    files?.forEach((file) => zip.addLocalFile(resolve(cwd, file), "/"));
    if (Object.keys(env).length > 0) {
        zip.addFile(".env", Buffer.from(new Env(env).toString()));
    }

    zip.writeZip(zipFile);
    console.log("created deployment zip file");

    return {
        zipFileName,
        zipFile
    };
}
