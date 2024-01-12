/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { cwd } from "./process.js";

export async function load() {
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
export type DeployApp = DeployConfig["apps"][number];
