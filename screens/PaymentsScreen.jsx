import React, {useEffect, useState, useCallback} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import api, {removeAuthToken, setAuthToken} from "../api/client";
import {COLORS} from "../variables/color";
import {useStateValue} from "../StateProvider";
import {decodeString} from "../helper/helper";
import AppButton from "../components/AppButton";
import PaymentHistoryCard from "../components/PaymentHistoryCard";
import {__} from "../language/stringPicker";
import {paginationData} from "../app/pagination/paginationData";
import {routes} from "../navigation/routes";
import {useIsFocused} from "@react-navigation/native";

const PaymentsScreen = ({navigation}) => {
  const [{auth_token, appSettings, rtl_support}] = useStateValue();
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(true);
  const [paymentsData, setPaymentsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState();
  const [refreshing, setRefreshing] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(
      pagination.page || paginationData.paymentHistory.page
  );
  const isFocused = useIsFocused();

  //  Initial Call
  useEffect(() => {
    loadPaymentsData(paginationData.paymentHistory);
  }, []);

  // Refreshing Call
  useEffect(() => {
    if (!refreshing) return;
    setCurrentPage(1);
    setPagination({});
    loadPaymentsData(paginationData.paymentHistory);
  }, [refreshing]);

  // next page  call
  useEffect(() => {
    if (!moreLoading) return;
    const data = {
      per_page: paginationData.paymentHistory.per_page,
      page: currentPage,
    };
    loadPaymentsData(data);
  }, [moreLoading]);

  // Retry call
  useEffect(() => {
    loadPaymentsData();
  }, [retry]);

;


// ...

const loadPaymentsData = async (arg) => {
  try {
    if (!!errorMessage) {
      setErrorMessage();
    }

    setAuthToken(auth_token);
    const res = await api.get("orders", arg);

    if (isFocused) {
      if (res?.ok) {
        if (moreLoading) {
          if (res?.data?.data?.length) {
            setPaymentsData((prevPaymentsData) => [
              ...prevPaymentsData,
              ...res.data.data,
            ]);
          }
        } else {
          if (res?.data?.data?.length) {
            setPaymentsData(res.data.data);
          }
        }
        setPagination(res.data.pagination ? res.data.pagination : {});
      } else {
        setErrorMessage(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __("paymentsScreenTexts.unknownError", appSettings.lng)
        );

        // Check if the response message is not "success"
        if (res?.data?.MESSAGE !== "Success") {
          // Display a specific error message for non-successful responses
          setErrorMessage(
            __("paymentsScreenTexts.nonSuccessError", appSettings.lng)
          );
        }

        // Do not proceed to the next page if there is an error
        return;
      }
    }
  } catch (error) {
    console.error("Error during payment:", error);
    console.log("Response data:", res?.data);
    console.log("Response message:", res?.data?.MESSAGE);
  console.log(res.data);
    setErrorMessage(
      __("paymentsScreenTexts.unknownError", appSettings.lng)
    );
  }
  finally {
    removeAuthToken();
  
    if (loading) {
      setLoading(false);
    }
  
    if (refreshing) {
      setRefreshing(false);
    }
  
    if (moreLoading) {
      setMoreLoading(false);
    }
  
    // Only navigate to the next page if there is no error and the response message is "Success"
    if (!errorMessage && res?.data?.MESSAGE === "Success" && moreLoading && pagination.total_pages > pagination.current_page) {
      handleNextPageLoading();
    }
  }
};

// ...



;

  const handleNextPageLoading = () => {
    if (refreshing) return;
    if (pagination && pagination.total_pages > pagination.current_page) {
      setCurrentPage((prevCurrentPage) => prevCurrentPage + 1);
      setMoreLoading(true);
    }
  };

  const handleCardPress = (item) => {
    navigation.navigate(routes.paymentDetailScreen, {id: item.id});
  };

  const handleRetry = () => {
    setLoading(true);
    setRetry((prevRetry) => !prevRetry);
  };

  const onRefresh = () => {
    if (moreLoading) return;
    setRefreshing(true);
  };

  const keyExtractor = useCallback((item, index) => `${index}`, []);

  const renderPayments = ({item}) => (
      <PaymentHistoryCard item={item} onCardPress={() => handleCardPress(item)}/>
  );
  const EmptyList = () => (
      <View style={styles.emptyListWrap}>
        <View style={styles.emptyMessageWrap}>
          <Text style={styles.text}>
            {__("paymentsScreenTexts.emptyListMessage", appSettings.lng)}
          </Text>
        </View>
        <AppButton
            title={__("paymentsScreenTexts.refreshButton", appSettings.lng)}
            onPress={handleRetry}
            style={{width: "50%"}}
        />
      </View>
  );

  const listFooter = () => {
    if (pagination && pagination.total_pages > pagination.current_page) {
      return (
          <View style={styles.loadMoreWrap}>
            <ActivityIndicator size="small" color={COLORS.primary}/>
          </View>
      );
    } else {
      return null;
    }
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };

  return (
      <View style={styles.container}>
        {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary}/>
            </View>
        ) : (
            <>
              {!!errorMessage ? (
                  <View style={styles.errorContainer}>
                    <View style={styles.emptyMessageWrap}>
                      <Text style={[styles.text, rtlText]}>
                        {decodeString(errorMessage)}
                      </Text>
                    </View>
                    <AppButton
                        title={__("paymentsScreenTexts.retryButton", appSettings.lng)}
                        onPress={handleRetry}
                        style={{width: "50%"}}
                    />
                  </View>
              ) : (
                  <View style={styles.flatListContainer}>
                    <FlatList
                        data={paymentsData}
                        renderItem={renderPayments}
                        keyExtractor={keyExtractor}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        ListEmptyComponent={EmptyList}
                        contentContainerStyle={styles.listContainer}
                        ListFooterComponent={listFooter}
                        onEndReached={handleNextPageLoading}
                        onEndReachedThreshold={0.2}
                    />
                  </View>
              )}
            </>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  emptyListWrap: {
    paddingHorizontal: "3%",
    marginTop: "30%",
    alignItems: "center",
  },
  emptyMessageWrap: {
    marginBottom: 30,
  },
  errorContainer: {
    paddingHorizontal: "3%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  flatListContainer: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: "3%",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PaymentsScreen;