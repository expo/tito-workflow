const mapping = {
  version: 0,
  data: [
    {
      branchMappingLogic: {
        clientKey: "branch",
        branchMappingOperator: "==",
        operand: "pr-1",
      },
      branchId: "3006c58b-742b-4b85-8897-a1d8d357e0d0",
    },
    {
      branchMappingLogic: {
        clientKey: "branch",
        branchMappingOperator: "==",
        operand: "pr-2",
      },
      branchId: "a918d25c-ca94-4312-97f3-00c072dc06af",
    },
    {
      branchMappingLogic: {
        clientKey: "branch",
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

const jsonString = JSON.stringify(mapping);
const escapedJsonString = jsonString.replace(/"/g, '\\"');
console.log('"' + escapedJsonString + '"');
