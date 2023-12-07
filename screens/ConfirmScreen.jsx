import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';

const ReceiptPage = ({ route }) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    // Retrieve data from route params
    const responseData = route.params?.responseData;
    if (responseData) {
      setPaymentStatus({ success: true, data: responseData });
    }
  }, [route.params]);

  const handlePay = async () => {
    try {
      setLoading(true);

      // Construct the API URL
      const apiUrl = `https://api.wayawaya.com/v1/payments/request/${paymentStatus.data.REFERENCE}`;

      // Construct the request payload
      const payload = {
        reference: paymentStatus.data.REFERENCE,
      };

      // Make the POST request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic MjU0NzE4NzYwNDU4NjU6Z3pTdTFTQWM=', // Add your authorization header
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log(responseData);

      if (response.ok) {
        setPaymentStatus({ success: true, data: responseData });
      } else {
        setPaymentStatus({ success: false, error: 'Failed to fetch payment status' });
      }
    } catch (error) {
      console.error('Error during payment:', error);
      setPaymentStatus({ success: false, error: 'Failed to fetch payment status' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.receiptContainer}>
        <Text style={styles.title}>Notification</Text>

        {/* Display "Pending..." in yellow before the confirm payment button is clicked */}
        {loading && (
          <Text style={[styles.loadingText, { color: 'yellow' }]}>Pending...</Text>
        )}

        {/* Display transaction success/failure based on the payment status */}
        {paymentStatus && !loading && (
          <>
            <Text style={styles.label}>Message:</Text>
            <Text style={styles.data}>{paymentStatus.data.MESSAGE}</Text>

            <Text style={styles.label}>Reference:</Text>
            <Text style={styles.data}>{paymentStatus.data.REFERENCE}</Text>
            <Text style={styles.label}>Request ID:</Text>
            <Text style={styles.data}>{paymentStatus.data.REQUEST_ID}</Text>

            <Text style={styles.label}>Status:</Text>
            <Text style={styles.data}>{paymentStatus.data.STATUS}</Text>

            {paymentStatus.data.STATUS === 'SUCCESS' && (
              <Text style={styles.successText}>Transaction Successful</Text>
            )}

            {paymentStatus.data.STATUS !== 'SUCCESS' && (
              <Text style={styles.errorText}>Transaction Cancelled by User</Text>
            )}
          </>
        )}
      </View>

      <Button
        title="Check Payment Status"
        color={loading ? 'gray' : '#e74c3c'}
        onPress={handlePay}
        disabled={loading}
        style={styles.confirmButton}
      />

      {loading && (
        <View>
          <ActivityIndicator size="large" color="#e74c3c" />
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
    receiptContainer: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      marginBottom: 20,
      width: '100%',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    label: {
      fontWeight: 'bold',
      marginBottom: 5,
    },
    data: {
      marginBottom: 10,
    },
    confirmButton: {
      marginTop: 20,
      borderRadius: 8,
      width: '80%',
      backgroundColor: '#e74c3c',
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    loadingText: {
      color: '#e74c3c',
      marginBottom: 10,
    },
    successText: {
      color: '#2ecc71',
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 10,
    },
    errorText: {
      color: '#e74c3c',
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 10,
    },
  });
  

export default ReceiptPage;
