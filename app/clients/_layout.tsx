import { Stack } from 'expo-router';

export default function ClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
