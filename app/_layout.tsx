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
        name="home" 
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
      <Stack.Screen 
        name="new-order" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen
        name="orders"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="clients"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="register-visit"
        options={{
          headerShown: false
        }}
      />
    </Stack>
  );
}
