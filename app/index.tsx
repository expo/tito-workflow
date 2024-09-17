import { useEffect, useCallback, useState } from "react";
import { Button, Text, View } from "react-native";
import * as Updates from "expo-updates";

type Branch = string;

// Can also point to a local server in dev
const API_URL = `https://tito-workflow--n1v6uoewca.staging.expo.app/branches`;

export default function Index() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const { currentlyRunning } = Updates.useUpdates();

  // TODO: persist the selected branch
  const selectBranch = useCallback(async (branch: Branch) => {
    await Updates.setExtraParamAsync("branch", branch);
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  }, []);

  const fetchBranches = useCallback(async () => {
    const response = await fetch(API_URL);
    const result = await response.json();
    setBranches(
      result.data.app.byId.updateBranches.map(
        (branch: { name: string }) => branch.name,
      ),
    );
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>
        Currently running:{" "}
        {currentlyRunning.updateId ? currentlyRunning.updateId : "no update"} /{" "}
        {currentlyRunning.createdAt?.toString()}
      </Text>

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: "bold" }}>Branches</Text>
      </View>

      {branches.map((branch) => (
        <Button
          key={branch}
          onPress={() => selectBranch(branch)}
          title={branch}
        />
      ))}
      <Button title="Fetch branches" onPress={fetchBranches} />
    </View>
  );
}