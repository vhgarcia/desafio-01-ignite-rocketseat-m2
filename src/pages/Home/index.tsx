import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
   const [products, setProducts] = useState<ProductFormatted[]>([]);
   const { addProduct, cart } = useCart();

   const cartItemsAmount = cart.reduce(
    (sumAmount, { id, amount }) => ({
      ...sumAmount,
      [id]: (sumAmount?.[id] || 0) + amount,
    }),
    {} as CartItemsAmount,
  );

  useEffect(() => {
    async function loadProducts() {
      let { data } = await api.get<Product[]>('/products');

      setProducts(
        data.map((product) => ({
          ...product,
          priceFormatted: formatPrice(product.price),
        })),
      );
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>
      {products.length &&
        products.map((product) =>(
          <li key={product.id}>
            <img src="https://rocketseat-cdn.s3-sa-east-1.amazonaws.com/modulo-redux/tenis1.jpg" alt="Tênis de Caminhada Leve Confortável" />
            <strong>{product.title}</strong>
            <span>{product.priceFormatted}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                  {cartItemsAmount[product.id] || 0}
              </div>

              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        ))
      }

    </ProductList>
  );
};

export default Home;
