import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
