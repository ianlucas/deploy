/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { existsSync } from "fs";
import { resolve } from "path";
import { cwd } from "./process";

export async function backup(zipFileName: string) {
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
