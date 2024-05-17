import { Row, Col, ListGroup, Button, } from "react-bootstrap";
import Link from "next/link";
import { useOrderActions, useTypedSelector } from "../../hooks";
import Loader from "../Loader";
import Message from "../Message";
import { useEffect } from "react";
import axios from 'axios';
import { OrderInterface } from "../../interfaces";
import { useRouter } from "next/router";


interface OrderProps {
  pageId: string | string[] | undefined;
}

const Order: React.FC<OrderProps> = ({ pageId }) => {
  const { loading, data, error, success } = useTypedSelector(
    (state) => state.order
  );
  const { loading: loadingDeliver } = useTypedSelector(
    (state) => state.orderDeliver
  );
  const user = useTypedSelector((state) => state.user);
  const { fetchOrder, deliverOrder } = useOrderActions();
  const router = useRouter();
  
  const createPaymentPreference = async (paymentData: OrderInterface) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    };
    try {
      const response = await axios.post('http://localhost:4000/payments/preference', paymentData, config);
      if (response.status === 201) {
        // aca deberia vaciar el carro, si la respuesta de mercadopago es correcta , te vacio el carro,
        window.location.href = response.data.preference.init_point
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: "error" };
    }
  };

  const delivered = () => {
    deliverOrder(data._id!)
  }

  useEffect(() => {
    if (!data._id || success) {
      if (!pageId) return;
      fetchOrder(pageId as string);
    }

  }, [fetchOrder, pageId, success, data,]);

  useEffect (() => {    // saca el id de la orden de la url
    const { id } = router.query
    fetchOrder(id)
    console.log('orderId:', id);
  }, [router.query] )

  const items = data.orderItems;
  var totalProductos = 0;
  items.forEach(function (item) {
    totalProductos += item.qty;
  });

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant="danger">{error}</Message>
  ) : (
    <>
      <section
        className="section-4"
      >
        {data.isDelivered && data.isPaid ? (
          <h1 className="heading-2"> Orden Finalizada nro: {data._id}</h1>
        ) : (
          <h1 className="heading-2">Orden Pendiente nro: {data._id}</h1>
        )}

        <div className="columns-2 w-row">
          <div className="column-5 w-col w-col-8">
            <div className="orderitem">
              <div className="container-item-order">
                <div className="txtordersubitem">
                  Nombre : <b>{data?.user?.name}</b>
                </div>
                <div className="txtordersubitem">
                  Email :{" "}
                  <a
                    className="txtordersubitem"
                    href={`mailto:${data?.user?.email}`}
                  >
                    <b>{data?.user?.email}</b>
                  </a>
                </div>
                <div className="txtordersubitem">
                  Dirección :<b>{data.shippingDetails.address}, {" "}
                  {data.shippingDetails.zoneDeliver}, {data.shippingDetails.postalCode},{" "}
                  {data.shippingDetails.country}</b>
                </div>
                <div className="txtordersubitem">
                  Horario de entrega: <b>{data?.shippingDetails.timeDeliver}</b>
                </div>
                <div className="txtordersubitem">
                  Si no hay stock: <b>{data?.shippingDetails.stockOption}</b>
                </div>
              </div>
            </div>
            <div className="orderitem" style={{ display: "flex", gap: 10 }}>
              {data.isDelivered ? (
                <div
                  className="deliveredpaid true"
                  style={{ width: 180, textAlign: "center", height: 60 }}
                >
                  Pedido enviado el {data.deliveredAt?.slice(3, 10)}

                </div>
              ) : (
                <div
                  className="deliveredpaid"
                  style={{ width: 180, textAlign: "center" }}
                >
                  Pedido no enviado

                </div>
              )}
              {data.isPaid ? (
                <div>
                  <div
                    className="deliveredpaid true"
                    style={{ width: 180, textAlign: "center", height: 60 }}
                  >
                    Pedido pago el {data.paidAt?.slice(3, 10)}
                  </div>
                </div>
              ) : (
                <div
                  className="deliveredpaid paid"
                  style={{ width: 180, textAlign: "center", height: 60 }}
                >
                  Pedido impago
                </div>
              )}
            </div>
            {data.isPaid && (
              <div>
                <div className="txtorderitem">Datos del pago</div>
                <div className="txtordersubitem">{data.paymentMethod}</div>
              </div>
            )}
            <div className="orderitem">
              <div className="txtorderitem">Items</div>
              {data.orderItems.length === 0 ? (
                <Message>El carro está vacío</Message>
              ) : (
                <ListGroup variant="flush">
                  {data.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row style={{ fontSize: 14, color: 'black', fontWeight: 800 }}>
                        <Col>
                          <Link href={`/product/${item.productId}`} passHref>
                            <span className="link__span">{item.name}</span>
                          </Link>
                        </Col>
                        <Col style={{ textAlign: "right" }} md={4}>
                          {item.qty} x ${item.price} = $
                          {(item.qty * item.price).toFixed(2)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>
          </div>

          <div className="column-6 w-col w-col-4 ">
            <div className="ordersummary px-4 d-flex">
              <div className="itemordersummary d-flex col pb-2">
                <div className="txtitemordersummary">
                  Cantidad de productos :
                </div>
                <div className="txtitemordersummary">{totalProductos}</div>
              </div>
              <div className="itemordersummary pb-3">
                <div className="txtitemordersummary fs-3">Total :</div>
                <div className="txtitemordersummary fs-3">
                  ${data.itemsPrice.toFixed(2)}
                </div>
              </div>

              {!data.isPaid && (
                <ListGroup.Item
                  style={{
                    border: "none",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {loading && <Loader />}

                  <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <img src='/images/mercado-pago.png' style={{marginBottom: '15px'}}></img>
                    <Button
                    
                      type="button"
                      className="btn btn-block"
                      onClick={() =>
                      (createPaymentPreference(data)
                      )
                      }
                    >
                      Pagar
                    </Button>
                  </div>

                </ListGroup.Item>
              )}

              {loadingDeliver && <Loader />}

              {user.data &&
                user.data.isAdmin &&
                data.isPaid &&
                !data.isDelivered && (
                  <ListGroup.Item style={{ border: "none" }}>
                    <Button
                      type="button"
                      className="btn btn-block"
                      onClick={delivered}
                    >
                      Marcar como entregado
                    </Button>
                  </ListGroup.Item>
                )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Order;


