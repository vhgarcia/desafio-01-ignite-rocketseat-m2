import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

type ProductItem = Omit<Product, 'amount'>;


interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart: Product[] = [];
      let productIndex: number = -1;
      const product = cart.find(({ id }, index) => {
        if (id === productId) productIndex = index;

        return id === productId;
      });

      if (!product) {
        const { data: newProduct } = await api.get<ProductItem>(
          `/products/${productId}`,
        );

        if (!newProduct)
          throw Error('Product does not exist to be added to cart');

        newCart = [
          ...cart,
          {
            ...newProduct,
            amount: 1,
          },
        ];
      } else {
        const { data: productStock } = await api.get<Stock>(
          `/stock/${productId}`,
        );
        if (product.amount + 1 > productStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        newCart = [...cart];
        newCart.splice(productIndex, 1, {
          ...product,
          amount: 1 + product.amount,
        });
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch (err) {
      toast.error('Erro na adição do produto');
      // console.error(err);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(({ id }) => id !== productId);

      if (newCart.length === cart.length)
        throw Error('Product does not exist to be removed from cart');

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      setCart(newCart);
    } catch (err) {
      toast.error('Erro na remoção do produto');
      // console.error(err);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let productIndex: number = -1;
      const product = cart.find(({ id }, index) => {
        if (id === productId) productIndex = index;

        return id === productId;
      });

      if (product) {
        const { data: productStock } = await api.get<Stock>(
          `/stock/${productId}`,
        );

        if (amount > productStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        } else if (amount <= 0) throw Error('Invalid amount quantity');

        let newCart = [...cart];
        newCart.splice(productIndex, 1, {
          ...product,
          amount,
        });

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else throw Error('Product does not exist to be updated');
    } catch (err) {
      toast.error('Erro na alteração de quantidade do produto');
      // console.error(err);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
