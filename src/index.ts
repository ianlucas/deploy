#!/usr/bin/env node

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { deploy } from "./deploy.js";
import { DeployApp, DeployConfig, load } from "./load.js";
import { args } from "./process.js";

async function main() {
    const config = await load();
    let [name] = args._;

    if (!config.ssh.host || !config.ssh.username || (!config.ssh.password && !config.ssh.privateKey)) {
        console.log("make sure to add host, username and password to deploy.js");
        process.exit(1);
    }

    if (!name && config.apps.length > 1) {
        console.log("please specify an app to deploy");
        process.exit(1);
    }

    name = name !== undefined ? name : config.apps[0].name;

    if (name === "all") {
        if (args["--backup"] !== undefined) {
            console.log("cannot backup all apps");
            process.exit(1);
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
        await deploy(config, app);
    }
}

main();

export type { DeployApp, DeployConfig };
