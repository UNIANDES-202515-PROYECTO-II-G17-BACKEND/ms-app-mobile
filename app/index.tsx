import { I18nextProvider } from "react-i18next";
import { Text, View } from "react-native";
import i18n from "./common/i18n";

export default function Index() {
  return (
    <I18nextProvider i18n={i18n}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Edit app/index.tsx to edit this screen.</Text>
      </View>
    </I18nextProvider>
  );
}
