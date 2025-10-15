import { Stack } from "expo-router";
import { OrderProvider } from '../contexts/OrderContext';

export default function NewOrderLayout() {
  return (
    <OrderProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="add-product" 
          options={{ 
            headerShown: false 
          }} 
        />
      </Stack>
    </OrderProvider>
  );
}
