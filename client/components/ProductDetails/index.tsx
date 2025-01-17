import { v4 as randomID } from 'uuid';
import {
  useCartActions,
  useProductsActions,
  useTypedSelector,
} from '../../hooks';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from 'react-bootstrap';
import Link from 'next/link';

interface ProductDetailsProps {
  pageId: string | string[] | undefined;
}


const ProductDetails: React.FC<ProductDetailsProps> = ({ pageId }) => {

  const [qty, setQty] = useState(1);
  const { fetchProduct, createProductReview } = useProductsActions();
  const { addToCart } = useCartActions();
  const { loading, error, data: product } = useTypedSelector(state => state.product);
  const { loading: cartLoading, data: cartData } = useTypedSelector(state => state.cart);
  const { data: user } = useTypedSelector(state => state.user);

  const { image, name, price, countInStock, description, rating, numReviews, _id } =
    product;

  useEffect(() => {
    if (!pageId) return;

    fetchProduct(pageId as string);
  }, [fetchProduct, pageId]);
  

  function addQtyProd() {
    
    const cartItemInterface = cartData.cartItems.find(function (item) { return item.productId == product._id; });

      if (countInStock <= cartItemInterface?.qty) {
        toast.error(`El stock es insuficiente`)  
        return
      }
      
      if(cartItemInterface){
      
        addToCart({
          qty: cartItemInterface?.qty + 1,   // debería sumar 1 a la cant de prod en el carro
          productId: _id,
        })
      } else {
          addToCart({
            qty: 1,   // suma el producto por primera vez
            product,
          })
        }
      toast.info("Producto agregado al carrito", {theme: "light"})
      }


  
  

  return (
    <section className="section-2">
      
      <div className="div-block-23" title='Ver detalle de producto'>
                <img
                  src={image? image : '/images/90656_VIVERA_UK_PACKSHOT_VEGGIE-BURGER-768x979-p-500.png'}
                  loading="lazy"

                />
              </div>
        <div className="div-block-24">
        <h1 className="heading-3">{name}</h1>
        <div className="div-block-26">Oferta</div>
        <div className="text-block-8">${price}</div>
        {
          countInStock > 0 ?
          <div className="text-block-9">Stock disponible</div>
          :
          <div className="text-block-9 agotado">Agotado</div>
        }
        
        
        <p className="paragraph-3">
          {description}
        </p>
        {countInStock > 0 ?
          <Button
            variant='success'
            type="button"
            className="btn btn-block"
            onClick={addQtyProd}
          >
            Añadir al carro
          </Button>
          : null
        }

        <Link href="/#productos" passHref>
          <Button
            variant='outline-dark'
            type="button"
            className="btn btn-block"
          >
            Volver
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default ProductDetails;



