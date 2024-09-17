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

export async function GET(request: Request) {
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
  return Response.json(result);
}
