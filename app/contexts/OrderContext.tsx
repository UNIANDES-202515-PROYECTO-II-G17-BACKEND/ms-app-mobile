import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface OrderProduct {
  id: string;
  nombre: string;
  sku: string;
  cantidad: number;
  stock: number;
  observaciones?: string;
  bodega_id?: string;
  precio_unitario?: number;
  impuesto_pct?: number;
}

interface OrderContextType {
  products: OrderProduct[];
  addProduct: (product: OrderProduct) => void;
  removeProduct: (productId: string) => void;
  clearProducts: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<OrderProduct[]>([]);

  const addProduct = (product: OrderProduct) => {
    console.log('OrderContext: Agregando producto', product);
    setProducts((prev) => {
      const newProducts = [...prev, product];
      console.log('OrderContext: Productos actualizados', newProducts);
      return newProducts;
    });
  };

  const removeProduct = (productId: string) => {
    console.log('OrderContext: Eliminando producto', productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearProducts = () => {
    console.log('OrderContext: Limpiando productos');
    setProducts([]);
  };

  console.log('OrderContext: Render, productos actuales:', products.length);

  return (
    <OrderContext.Provider value={{ products, addProduct, removeProduct, clearProducts }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
