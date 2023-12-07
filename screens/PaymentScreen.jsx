import React, { useState,useEffect} from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { routes } from "../navigation/routes";

const PaymentComponent = ({route}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [price,setPrice] = useState(null);
  const [title,setTitle] =useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    // Retrieve data from route params
    const Price = route.params?.Price;
    const Title=route.params?.Title
    if (Price) {
        function convertToInteger(valueWithCommas) {
            // Remove commas from the string
            const stringWithoutCommas = valueWithCommas.replace(/,/g, '');
          
            // Parse the string as an integer
            const integerValue = parseInt(stringWithoutCommas, 10);
          
            return integerValue;
          }
          
          // Example usage:
          
          const result = convertToInteger(Price);
          setPrice(result);
          setTitle(Title);
    }
  }, [route.params])

  console.log(price);

  const handlePay = async () => {
    try {
      setLoading(true);
  
      const apiUrl = "https://api.wayawaya.com/v1/payments/request/mpesastk";
      const authorizationHeader = "Basic MjU0NzE4NzYwNDU4NjU6Z3pTdTFTQWM=";
      const sessionCookie = "session=055320a0-94bc-46ca-b80c-186d1f0138d1";
  
      const formattedPhoneNumber = phoneNumber.startsWith("254") ? phoneNumber : "254" + phoneNumber;
  
      const payload = {
        username: "shanekizito",
        amount:price,
        description: title,
        charge_phone: formattedPhoneNumber,
      };
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationHeader,
          Cookie: sessionCookie,
        },
        body: JSON.stringify(payload),
      });
  
      const responseData = await response.json();
  
      if (responseData.MESSAGE === "Success. Request accepted for processing") {
        console.log(responseData.MESSAGE);
        setPaymentStatus({ success: true, data: responseData });
        // Navigate to ConfirmPayment screen upon successful payment
        navigation.navigate(routes.confirmScreen, { responseData });
      } else {
        // Display an error message and do not navigate
        console.log(responseData.MESSAGE); // Log the error message
        setPaymentStatus({ success: false, error: "Payment request not successful" });
      }
    } catch (error) {
      console.error("Error during payment:", error);
      // Display an error message and do not navigate
      setPaymentStatus({ success: false, error: "Payment request not successful" });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Phone Number (starting with 254):</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={(text) => setPhoneNumber(text)}
      />

      <Button
        title="Proceed to Pay"
        color="#e74c3c" // Red color
        onPress={handlePay}
        disabled={loading || phoneNumber.length === 0 || !phoneNumber.startsWith('254')}
      />

      {loading && (
        <View>
          <Text style={styles.loadingText}>Waiting for payment...</Text>
          <ActivityIndicator size="large" color="#e74c3c" />
        </View>
      )}

      {paymentStatus && (
        <View>
          {paymentStatus.success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>Transaction successful!</Text>
              <Text>Response Data: {JSON.stringify(paymentStatus.data)}</Text>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Payment failed!</Text>
              <Text>Error Data: {JSON.stringify(paymentStatus.error)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
    borderRadius: 5,
  },
  loadingText: {
    color: '#e74c3c',
    marginBottom: 10,
  },
  successContainer: {
    marginTop: 20,
    backgroundColor: '#2ecc71', // Green color
    padding: 10,
    borderRadius: 5,
  },
  successText: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorContainer: {
    marginTop: 20,
    backgroundColor: '#e74c3c', // Red color
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default PaymentComponent;
