// @ts-check
/** @type {import('./src/index').DeployConfig} */
export default {
    ssh: {
        host: "192.168.0.1",
        username: "yo user",
        password: "yo pass"
    },

    defaults: {
        folders: ["build", "prisma", "public"],
        files: ["package.json", "package-lock.json"]
    },

    merges: {
        env: {
            COMMON_ENV_VAR_1: 1
        }
    },

    apps: [
        {
            name: "my-app",
            folders: ["build", "prisma", "public"],
            files: ["package.json", "package-lock.json"],
            env: {
                MY_ENV_VAR_1: 1,
                MY_ENV_VAR_2: "hello"
            }
        },
        {
            name: "my-other-app"
        }
    ],

    beforeZip({ name, $ }) {
        $`npm run switch ${name}`;
        $`npm run build`;
    },

    async afterDeploy({ $, deployPathCwd }) {
        await $(`npm run script scripts/example.ts`, deployPathCwd);
    }
};
