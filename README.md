# Extension Template

This template is the boilerplate code for a Cosmos Extension.

A Cosmos Extension is a CDK project that consumes shared resources made available through the Cosmos Core. It extends those resources with further resources required for one application. Cosmos is designed so a single Core provides shared resources for many Extensions.

An extension consumes and extends Core resources through Cosmos constructs provided in this template. Those are:

- `AppCiCdSolarSystemStack` defined in [ci-cd-solar-system.ts](lib/ci-cd-solar-system.ts)
- `AppCosmosStack` defined in [cosmos.ts](lib/cosmos.ts)
- `AppGalaxyStack` defined in [galaxy.ts](lib/galaxy.ts)
- `AppSolarSystemStack` defined in [solar-system.ts](lib/solar-system.ts)

As an example, your application may require an s3 bucket for each environment it will be deployed to. Those environments are the `Dev` and `Prd` SolarSystems defined in your Cosmos Core.

In [solar-system.ts](lib/solar-system.ts), add the s3 Bucket:

```ts
export class AppSolarSystemStack extends SolarSystemExtensionStack {
  readonly galaxy: AppGalaxyStack;

  constructor(galaxy: AppGalaxyStack, id: string, props?: AppSolarSystemProps) {
    super(galaxy, id, props);

    // ... 

    const someBucket = new Bucket(this, "someBucket");

    // ...
```

> Note: The template comes with helper code to create a typical ECS service. This may be removed or customised. 

In [main.ts](bin/main.ts). instantiate the `AppSolarSystemStack` once for each Solar System in the Core that you want to deploy your application's resources to:

```ts
const dev = new AppSolarSystemStack(devGalaxy, "Dev", {
  // ...
});

const prd = new AppSolarSystemStack(devGalaxy, "Prd", {
  // ...
});
```

In this example, the Cosmos Core has two instances of a `SolarSystemCoreStack` defined:

```ts
// In the Core

const dev = new SolarSystemCoreStack(devGalaxy, "Dev", {
  // ...
});

const prd = new SolarSystemCoreStack(devGalaxy, "Prd", {
  // ...
});
```

Cosmos knows which `SolarSystemCoreStack` in the Core the `AppSolarSystemStack` in the Extension is referring to by its `id`. In this example they are `Dev` and `Prd`.

When the Extension CDK CodePipeline is run, the s3 bucket will be deployed into both the `Dev` and `Prd` Solar Systems.

See the [docs](https://cdk-cosmos.github.io/law/docs/) for a full list of constructs provided by the Cosmos. 

## Bootstrapping: Getting Started with a Cosmos Extension

This section describes the steps involved in bootstrapping a Cosmos Extension.

Extensions include a `AppCiCdSolarSystemStack`, which is responsible for the resources that build and deploy your CDK and code. This includes deploying any changes to the Extension itself. However, before this CI/CD stack can deploy anything, it needs to be deployed itself. Once this and the other essential stacks of an Extension are deployed, further resources may be created by adding CDK or Cosmos constructs, or uncommenting the helper code included with this Extension in `bin/main.ts`. It may then be deployed using the Extension's own CDK CodePipeline.

1. Clone the this repository to your workstation (https://github.com/cdk-cosmos/cosmos-extension-cdk.git)

2. In the base directory of this project, run `npm install`.

3. In `bin/main.ts`, complete the configuration objects with your account numbers and regions. You may also wish to add a `prdEnvConfig` object, or any that works with your particular multi-account pattern.

```ts
// AWS Env Config
const mgtEnvConfig = { account: '<your management AWS account number here>', region: '<your preferred region here' };
const devEnvConfig = { account: '<your dev AWS account number here>', region: '<your preferred region here' };
```

4. In `bin/main.ts`, change the project name from `Demo` to the name of your application.

```ts
// Extend the Cosmos + Add our App bits
const cosmos = new AppCosmosStack(app, '<your application name here>', {
  env: mgtEnvConfig,
});
```

5. The Cosmos CDK Toolkit should have been deployed along with the Cosmos Core. If not, follow the instructions [here](https://github.com/cdk-cosmos/cosmos/tree/develop/packages/%40cosmos-building-blocks/common#the-cosmos-cdk-toolkit) to deploy it. 

6. Using the credentials of your AWS master account, log in to the AWS CLI.

7. Run `npx cdk --app "node_modules/@cosmos-building-blocks/common/lib/cdk-toolkit/bootstrap-app.js" deploy`. 

This will archive this Extension and pass it as an asset to the Cosmos CDK Toolkit s3 bucket in your master account, and trigger the CodeBuild job to bootstrap your Extension.

8. A CodeCommit repository to house this newly customised Extension was created as part of the bootstrapping process above. Update the git repository in this Extension to point to the new CodeCommit respository. Replacing the `<your-region>` section with the region you selected in `Step 3` and the `<your-project-name>` section with the name you gave your project in `Step 4`, run the following command:

`git remote set-url origin "https://git-codecommit.<your-region>.amazonaws.com/v1/repos/app-<your-project-name>-cdk-repo"` 

7. Add the changes made to this template by running `git add .`, commit the changes by running `git commit -m "inital commit"`, and push the changes to CodeCommit by running `git push`

Your Extension is bootstrapped. Any further changes may be deployed using the Extension's own CDK CodePipeline.
