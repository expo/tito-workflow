# How to add staging previews to your app

> [!IMPORTANT]
> The feature described here is in an expeirmental state and is subject to change. We believe this is a valuable feature and we will be working to make it stable and easier to use.

This repository includes a simple app that demonstrates how to use EAS Update to preview different branches in a release build in a staging environment (without [using expo-dev-client](https://docs.expo.dev/eas-update/expo-dev-client/)). This is useful to allow non-technical users to preview changes to your app before they are merged into the main branch. To run the example app, run `yarn` and then `yarn expo run:ios --configuration release` or `yarn expo run:android --variant release`.

The following steps walk you through how to add the same functionality to the staging version of your own app.

**We recommend against using this functionality in production**, you should only use it in a staging environment where you are comfortable with the possibility of users loading different branches of your app and potentially accidentally bricking their install, requiring them to uninstall and reinstall the app.

## 1. Set up EAS Update, staging channel, and some test branches

- Initialize EAS Update in your app, if you haven't already: `eas update:configure` ([learn more](https://docs.expo.dev/eas-update/getting-started/)).
- Create a staging channel: `eas channel:create staging`
- Create a couple branches, we will use `pr-1`, `pr-2` and `pr-3` for this example. You can use whatever branch names you want. Publish updates to each of those branches with some slight changes on each, so you can observe the differences when you load them. For example, you might add some text that says "this is branch pr-1" . Run `eas update --branch pr-1` to publish to a branch called pr-1, and so on.

## 2. Add staging updates configuration to app config

We'll need to configure the `updates` section of your app config with the following properties. Note that we only want this configuration to apply in staging builds, so we can use **app.config.ts** to conditionally apply it depending on some environment variable (such as `EAS_BUILD_PROFILE`).

```js
{
  // ... other config
  updates: {
    useEmbeddedUpdate: false,
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 60_000,
    requestHeaders: {
      "expo-channel-name": "staging",
    },
  }
}
```

- We ignore the embedded update in staging builds, and will fetch the update from the server on the initial load. Subsequent loads can use any downloaded update. This is possibly not ideal for everybody, it's a limitation with this approach right now and we'd like to resolve it.
- We set the channel name here to `staging` so that it will apply when you run prebuild locally, so we don't depend on EAS setting the channel name configuration.

## 3. Configure the staging channel to point to pr-* branches

> [!WARNING]
> This is the messiest part of the entire process, and we'd like to make it better.

The idea here is that when you query for new updates, we can attach a header with a name of our choice like "branch-override" with a value of "pr-1", "pr-2" or "pr-3", and EAS Update will return updates for that branch. This header configuration is persisted and will be used across app launches until it is unset or changed. If the server starts to map the parameter to a different branch (for example, if you delete one of the pr branches and it will proceed to whichever branch you have configured as a fallback, such as `staging`), then it will use the new branch.


### 3.1. Create a channel-branch mapping configuration

A channel-branch mapping configuration is a JSON object that looks like this:

```
{
  version: 0,
  data: [
    {
      branchMappingLogic: {
        clientKey: "branch-override",
        branchMappingOperator: "==",
        operand: "pr-1",
      },
      branchId: "3006c58b-742b-4b85-8897-a1d8d357e0d0",
    },
    {
      branchMappingLogic: {
        clientKey: "branch-override",
        branchMappingOperator: "==",
        operand: "pr-2",
      },
      branchId: "a918d25c-ca94-4312-97f3-00c072dc06af",
    },
    {
      branchMappingLogic: {
        clientKey: "branch-override",
        branchMappingOperator: "==",
        operand: "pr-3",
      },
      branchId: "d7b08cb0-505d-4d8c-9df5-dd2bb9e73eac",
    },
    {
      branchMappingLogic: "true",
      branchId: "e298b4c5-7582-4050-a3a3-10c34e19a1ae",
    },
  ],
};
```

- Notice that the `data` field is an array of objects, where each is a rule that is applied in order while resolving the branch mapping. The first rule in the array can be read as: "if the `branch-override` header is `pr-1`, then use branchId `3006c58b-742b-4b85-8897-a1d8d357e0d0`". If the header isn't present, or if it doesn't match the rule, then the next rule is checked, and so on.
- Branch IDs can be found by running `eas branch:list` (or `eas branch:list --json --non-interactive` for a machine readable output). Alternatively, refer to its details page on the expo.dev website.
- You will need to update this mapping any time you add or remove a branch, or change the branch name. This can be automated, for example when you publish an update to a branch you could add a script to your CI that updates the mapping.

### 3.2. Set that configuration with a GraphQL request

```graphql
mutation AddBranchMapping($channelId: ID!, $branchMapping: String!) {
  updateChannel {
    editUpdateChannel(channelId: $channelId, branchMapping: $branchMapping) {
      id
    }
  }
}
```

- Channel IDs can be found by running `eas channel:list` (or `eas channel:list --json --non-interactive` for a machine readable output). Alternatively, refer to its details page on the expo.dev website.
- The `branchMapping` is a JSON string. For example:
  ```
  "{\"version\":0,\"data\":[{\"branchMappingLogic\":{\"clientKey\":\"branch\",\"branchMappingOperator\":\"==\",\"operand\":\"pr-1\"},\"branchId\":\"3006c58b-742b-4b85-8897-a1d8d357e0d0\"},{\"branchMappingLogic\":{\"clientKey\":\"branch\",\"branchMappingOperator\":\"==\",\"operand\":\"pr-2\"},\"branchId\":\"a918d25c-ca94-4312-97f3-00c072dc06af\"},{\"branchMappingLogic\":{\"clientKey\":\"branch\",\"branchMappingOperator\":\"==\",\"operand\":\"pr-3\"},\"branchId\":\"d7b08cb0-505d-4d8c-9df5-dd2bb9e73eac\"},{\"branchMappingLogic\":\"true\",\"branchId\":\"e298b4c5-7582-4050-a3a3-10c34e19a1ae\"}]}"
  ```

## 4. Configure your app to use the branch mapping

Now that everything is set up on the EAS Update side to point to the right branch, you can use `Update.setExtraParamAsync` in your staging builds (builds that use the `staging` channel) to set the branch override header.

```ts
async function selectBranch(branch: string) => {
  await Updates.setExtraParamAsync("branch-override", branch);
  // Show some loading indicator?
  const result = await Updates.fetchUpdateAsync();
  // Handle result if you want to
  await Updates.reloadAsync();
}
```

Everything should now work end to end. However, this isn't quite everything we'd need to build a full featured branch preview workflow because we would also want to be able to access a list of available branches in the app and select one to preview.

## 5. Fetching a list of available branches from the EAS API

There are two ways to query the EAS API to get a list of branches.

### EAS CLI

We generally recommend using EAS CLI to do this, because we do not document or commit to our GraphQL API. You can install `eas-cli` on your server and set an `EXPO_TOKEN` environment variable, then run `eas branch:list --json --non-interactive` to get a list of branches. Use the `--limit` and `--offset` flags to paginate through the results if needed.

### Undocumented GraphQL API

You can also use the GraphQL API to get a list of branches, but we don't commit to any public API contract for it so it may change in the future without notice. The following is an example of how you can query the GraphQL API to get a list of branches:


```ts
const query = `
query GetBranches($appId: String!) {
  app {
    byId(appId:$appId) {
      updateBranches(offset:0, limit:10) {
        name
      }
    }
  }
}
`;

async function fetchBranches() {
  const response = await fetch("https://api.expo.dev/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EXPO_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      variables: { appId: process.env.EXPO_PROJECT_ID },
    }),
  });

  const result = await response.json();
}
```

## 6. Build a UI around everything

Now that you have a list of branches, you can build a UI that allows the user to select a branch to preview, and then use the `Updates.setExtraParamAsync` function to set the branch override header when the user selects a branch. That's about it!