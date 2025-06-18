import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { addToCart, deleteFromCart, getCart, placeOrder } from "../api";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/reducers/snackbarSlice";
import { DeleteOutline } from "@mui/icons-material";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 200px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg};
`;
const Section = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 22px;
  gap: 28px;
`;
const Title = styled.div`
  font-size: 28px;
  font-weight: 500;
  display: flex;
  justify-content: ${({ center }) => (center ? "center" : "space-between")};
  align-items: center;
`;

const Wrapper = styled.div`
  display: flex;
  gap: 32px;
  width: 100%;
  padding: 12px;
  @media (max-width: 750px) {
    flex-direction: column;
  }
`;
const Left = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (max-width: 750px) {
    flex: 1.2;
  }
`;
const Table = styled.div`
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 30px;
  ${({ head }) => head && `margin-bottom: 22px`}
`;
const TableItem = styled.div`
  ${({ flex }) => flex && `flex: 1; `}
  ${({ bold }) =>
    bold &&
    `font-weight: 600; 
  font-size: 18px;`}
`;
const Counter = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.text_secondary + 40};
  border-radius: 8px;
  padding: 4px 12px;
`;

const Product = styled.div`
  display: flex;
  gap: 16px;
`;
const Img = styled.img`
  height: 80px;
`;
const Details = styled.div``;
const Protitle = styled.div`
  color: ${({ theme }) => theme.primary};
  font-size: 16px;
  font-weight: 500;
`;
const ProDesc = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const ProSize = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const Right = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (max-width: 750px) {
    flex: 0.8;
  }
`;
const Subtotal = styled.div`
  font-size: 22px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
`;
const Delivery = styled.div`
  font-size: 18px;
  font-weight: 500;
  display: flex;
  gap: 6px;
  flex-direction: column;
`;

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(false);
  const [products, setProducts] = useState([]);
  const [buttonLoad, setButtonLoad] = useState(false);

  const [deliveryDetails, setDeliveryDetails] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
    completeAddress: "",
  });

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolderName: "",
  });

  useEffect(() => {
    getProducts();
  }, [reload]);

  const getProducts = async () => {
    setLoading(true);
    const token = localStorage.getItem("krist-app-token");
    try {
      const res = await getCart(token);
      setProducts(res.data);
    } catch (err) {
      dispatch(openSnackbar({ message: "Error loading cart.", severity: "error" }));
    } finally {
      setLoading(false);
    }
  };

  const addCart = async (id) => {
    const token = localStorage.getItem("krist-app-token");
    try {
      await addToCart(token, { productId: id, quantity: 1 });
      setReload(!reload);
    } catch (err) {
      dispatch(openSnackbar({ message: err.message, severity: "error" }));
      setReload(!reload);
    }
  };

  const removeCart = async (id, type) => {
    const token = localStorage.getItem("krist-app-token");
  
    try {
      await deleteFromCart(token, {
        productId: id,
        quantity: type === "full" ? null : 1,
      });
      setReload(!reload);
    } catch (err) {
      dispatch(
        openSnackbar({
          message: err.message,
          severity: "error",
        })
      );
      setReload(!reload);
    }
  };

  const calculateSubtotal = () => {
    return products.reduce(
      (total, item) => total + item.quantity * item?.product?.price?.org,
      0
    );
  };

  const convertAddressToString = (addressObj) => {
    return `${addressObj.firstName} ${addressObj.lastName}, ${addressObj.completeAddress}, ${addressObj.phoneNumber}, ${addressObj.emailAddress}`;
  };

  const PlaceOrder = async () => {
    if (!products.length) {
      dispatch(openSnackbar({ message: "Your cart is empty.", severity: "warning" }));
      return;
    }

    setButtonLoad(true);
    const isDeliveryComplete = Object.values(deliveryDetails).every(Boolean);
    const isPaymentComplete = Object.values(paymentDetails).every(Boolean);

    if (!isDeliveryComplete || !isPaymentComplete) {
      dispatch(openSnackbar({ message: "Please fill all required fields.", severity: "error" }));
      setButtonLoad(false);
      return;
    }

    try {
      const token = localStorage.getItem("krist-app-token");
      const totalAmount = calculateSubtotal().toFixed(2);
      const orderDetails = {
        products,
        address: convertAddressToString(deliveryDetails),
        totalAmount,
        paymentDetails,
      };

      await placeOrder(token, orderDetails);
      dispatch(openSnackbar({ message: "Order placed successfully", severity: "success" }));
      setReload(!reload);
    } catch (error) {
      dispatch(openSnackbar({ message: "Failed to place order. Try again.", severity: "error" }));
    } finally {
      setButtonLoad(false);
    }
  };

  return (
    <Container>
      {loading ? (
        <CircularProgress />
      ) : (
        <Section>
          <Title>Your Shopping Cart</Title>
          {products.length === 0 ? (
            <>Cart is empty</>
          ) : (
            <Wrapper>
              <Left>
                <Table head>
                  <TableItem bold flex>Product</TableItem>
                  <TableItem bold>Price</TableItem>
                  <TableItem bold>Quantity</TableItem>
                  <TableItem bold>Subtotal</TableItem>
                  <TableItem></TableItem>
                </Table>
                {products.map((item, index) => (
                  <Table key={item.product._id}>
                    <TableItem flex>
                      <Product>
                        <Img src={item?.product?.img} />
                        <Details>
                          <Protitle>{item?.product?.title}</Protitle>
                          <ProDesc>{item?.product?.name}</ProDesc>
                          <ProSize>Size: XL</ProSize>
                        </Details>
                      </Product>
                    </TableItem>
                    <TableItem>${item?.product?.price?.org}</TableItem>
                    <TableItem>
                      <Counter>
                      <div
  style={{
    cursor: "pointer",
    flex: 1,
  }}
  onClick={() =>
    item?.quantity > 1
      ? removeCart(item?.product?._id, "partial")
      : removeCart(item?.product?._id, "full")
  }
>
  -
</div>
                        {item?.quantity}
                        <div onClick={() => addCart(item?.product?._id)} style={{ cursor: "pointer" }}>+</div>
                      </Counter>
                    </TableItem>
                    <TableItem>${(item.quantity * item?.product?.price?.org).toFixed(2)}</TableItem>
                    <TableItem>
                      <DeleteOutline
                        sx={{ color: "red", cursor: "pointer" }}
                        onClick={() => removeCart(item?.product?._id, item?.quantity, "full")}
                      />
                    </TableItem>
                  </Table>
                ))}
              </Left>
              <Right>
                <Subtotal>Subtotal : ${calculateSubtotal().toFixed(2)}</Subtotal>
                <Delivery>
                  Delivery Details:
                  <div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <TextInput small placeholder="First Name" value={deliveryDetails.firstName}
                        handleChange={(e) => setDeliveryDetails({ ...deliveryDetails, firstName: e.target.value })} />
                      <TextInput small placeholder="Last Name" value={deliveryDetails.lastName}
                        handleChange={(e) => setDeliveryDetails({ ...deliveryDetails, lastName: e.target.value })} />
                    </div>
                    <TextInput small placeholder="Email Address" value={deliveryDetails.emailAddress}
                      handleChange={(e) => setDeliveryDetails({ ...deliveryDetails, emailAddress: e.target.value })} />
                    <TextInput small placeholder="Phone no. +91 XXXXX XXXXX" value={deliveryDetails.phoneNumber}
                      handleChange={(e) => setDeliveryDetails({ ...deliveryDetails, phoneNumber: e.target.value })} />
                    <TextInput small textArea rows="5" placeholder="Complete Address"
                      value={deliveryDetails.completeAddress}
                      handleChange={(e) => setDeliveryDetails({ ...deliveryDetails, completeAddress: e.target.value })} />
                  </div>
                </Delivery>
                <Delivery>
                  Payment Details:
                  <div>
                    <TextInput small placeholder="Card Number" value={paymentDetails.cardNumber}
                      handleChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })} />
                    <div style={{ display: "flex", gap: "6px" }}>
                      <TextInput small placeholder="Expiry Date" value={paymentDetails.expiryDate}
                        handleChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })} />
                      <TextInput small placeholder="CVV" value={paymentDetails.cvv}
                        handleChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })} />
                    </div>
                    <TextInput small placeholder="Card Holder name" value={paymentDetails.cardHolderName}
                      handleChange={(e) => setPaymentDetails({ ...paymentDetails, cardHolderName: e.target.value })} />
                  </div>
                </Delivery>
                <Button
                  text="Place Order"
                  small
                  isLoading={buttonLoad}
                  isDisabled={buttonLoad}
                  onClick={PlaceOrder}
                />
              </Right>
            </Wrapper>
          )}
        </Section>
      )}
    </Container>
  );
};

export default Cart;