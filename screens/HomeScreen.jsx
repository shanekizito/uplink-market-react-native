import React, {useState, useEffect, useCallback, useRef} from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Animated,
  ActivityIndicator,
  Keyboard,
  Alert,
  Pressable,
  BackHandler,
} from "react-native";

// Vector Fonts
import {
  FontAwesome,
  FontAwesome5,
  Ionicons,
  Fontisto,
  Feather,
  Entypo,
} from "@expo/vector-icons";
import {Formik} from "formik";

// Custom Components & Constants
import {COLORS} from "../variables/color";
import TabScreenHeader from "../components/TabScreenHeader";
import {useStateValue} from "../StateProvider";
import api, {removeAuthToken, setAuthToken} from "../api/client";
import {decodeString} from "../helper/helper";
import FlashNotification from "../components/FlashNotification";
import AppButton from "../components/AppButton";
import ListingCard from "../components/ListingCard";
import ListingCardList from "../components/ListingCardList";
import {paginationData} from "../app/pagination/paginationData";
import CategoryIcon from "../components/CategoryIcon";
import CategoryImage from "../components/CategoryImage";
import {__} from "../language/stringPicker";
import {admobConfig} from "../app/services/adMobConfig";
import {routes} from "../navigation/routes";
import settingsStorage from "../app/settings/settingsStorage";
import {useFocusEffect, useScrollToTop} from "@react-navigation/native";
import {miscConfig} from "../app/services/miscConfig";

const {width: screenWidth, height: screenHeight} = Dimensions.get("screen");
const {height: windowHeight} = Dimensions.get("window");

const HomeScreen = ({navigation}) => {
  const [
    {
      search_locations,
      config,
      search_categories,
      cat_name,
      user,
      appSettings,
      rtl_support,
      auth_token,
    },
    dispatch,
  ] = useStateValue();
  const [topCategoriesData, setTopCategoriesData] = useState([]);
  const [allCategoriesData, setAllCategoriesData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchData, setSearchData] = useState(() => {
    return {
      ...paginationData.home,
      search: "",
      locations: search_locations.length
          ? search_locations.map((location) => location.term_id)
          : "",
      categories: "",
      page: pagination.current_page || 1,
      onScroll: false,
    };
  });
  const [locationsData, setLocationsData] = useState([]);
  const [listingsData, setListingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const [flashNotification, setFlashNotification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timedOut, setTimedOut] = useState();
  const [networkError, setNetworkError] = useState();
  const [retry, setRetry] = useState(false);
  const [scrollButtonVisible, setScrollButtonVisible] = useState(false);

  const iosFlatList = useRef();
  useScrollToTop(iosFlatList);

  const backAction = () => {
    Alert.alert("", __("homeScreenTexts.exitAppWarning", appSettings.lng), [
      {
        text: __("homeScreenTexts.cancelButtonTitle", appSettings.lng),
        onPress: () => null,
      },
      {
        text: __("homeScreenTexts.yesButtonTitle", appSettings.lng),
        onPress: () => BackHandler.exitApp(),
      },
    ]);
    return true;
  };
  useFocusEffect(
      useCallback(() => {
        BackHandler.addEventListener("hardwareBackPress", backAction);
        return () =>
            BackHandler.removeEventListener("hardwareBackPress", backAction);
      }, [])
  );
  useEffect(() => {
    if (!miscConfig?.enableHomeButtonRefreshAction) return;
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      if (
          searchData.categories ||
          searchData.locations?.length ||
          searchData.search
      ) {
        handleReset();
      }
    });
    return unsubscribe;
  }, [navigation, searchData]);

  // Search on Location Change
  useEffect(() => {
    if (!search_locations) return;
    setSearchData((prevSearchData) => {
      return {
        ...prevSearchData,
        locations: search_locations
            .map((location) => location.term_id)
            .splice(search_locations.length - 1),
        page: 1,
      };
    });
    setLoading(true);
  }, [search_locations]);

  // Search on Category Change from All Category Page
  useEffect(() => {
    if (!search_categories.length) return;
    setSearchData((prevSearchData) => {
      return {
        ...prevSearchData,
        categories: search_categories[search_categories.length - 1],
        page: 1,
      };
    });
    setLoading(true);
  }, [search_categories]);

  // Initial Load Listings Data
  useEffect(() => {
    if (!initial) return;
    dispatch({
      type: "SET_NEW_LISTING_SCREEN",
      newListingScreen: false,
    });
    handleLoadTopCategories();
    if (config.location_type === "local") {
      handleLoadLocations();
    }
    handleLoadListingsData();
  }, [initial, config, appSettings.lng]);

  useEffect(() => {
    if (!loading) return;
    if (!retry) {
      dispatch({
        type: "SET_NEW_LISTING_SCREEN",
        newListingScreen: false,
      });
      handleLoadListingsData();
    } else {
      handleLoadTopCategories();
      if (config.location_type === "local") {
        handleLoadLocations();
      }
      handleLoadListingsData();
    }
  }, [loading]);

  // Get Listing on Next Page Request
  useEffect(() => {
    if (!searchData.onScroll) return;

    handleLoadListingsData(true);
  }, [searchData.onScroll]);

  // Refreshing get listing call
  useEffect(() => {
    if (!refreshing) return;
    handleLoadListingsData();
  }, [refreshing]);

  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  const onRefresh = () => {
    if (moreLoading) return;
    setRefreshing(true);
  };

  const handleLoadLocations = () => {
    api.get("locations").then((res) => {
      if (res.ok) {
        setLocationsData(res.data);
      } else {
        // print error
        // TODO handle error
        if (res.problem === "CANCEL_ERROR") {
          return true;
        }
      }
    });
  };

  const handleLoadListingsData = (onScroll) => {
    if (user) {
      setAuthToken(auth_token);
    }
    const args = !refreshing ? {...searchData} : {...searchData, page: 1};
    api.get("listings", args).then((res) => {
      if (res.ok) {
        if (refreshing) {
          setRefreshing(false);
        }
        if (onScroll) {
          if (admobConfig.admobEnabled) {
            if (listingsData?.length % 2 == 0) {
              setListingsData((prevListingsData) => [
                ...prevListingsData,
                {listAd: true},
                {listAd: true, dummy: true},
                ...res.data.data,
              ]);
            } else {
              setListingsData((prevListingsData) => [
                ...prevListingsData,
                {listAd: true, dummy: true},
                {listAd: true},
                ...res.data.data,
              ]);
            }
          } else {
            setListingsData((prevListingsData) => [
              ...prevListingsData,
              ...res.data.data,
            ]);
          }
          setSearchData((prevSearchData) => {
            return {
              ...prevSearchData,
              onScroll: false,
            };
          });
        } else {
          setListingsData(res.data.data);
        }
        setPagination(res.data.pagination ? res.data.pagination : {});
        if (initial) {
          setInitial(false);
        }
        if (user) {
          removeAuthToken();
        }
        setLoading(false);
      } else {
        if (refreshing) {
          setRefreshing(false);
        }
        if (res.problem === "CANCEL_ERROR") {
          return true;
        }
        if (res.problem === "TIMEOUT_ERROR") {
          setTimedOut(true);
        }
        if (user) {
          removeAuthToken();
        }
      }
      setMoreLoading(false);
      setLoading(false);
    });
  };
  const handleNextPageLoading = () => {
    // if (!searchData.onScroll) return;
    if (pagination && pagination.total_pages > pagination.current_page) {
      setMoreLoading(true);
      setSearchData((prevSearchData) => {
        return {
          ...prevSearchData,
          page: prevSearchData.page + 1,
          onScroll: true,
        };
      });
    }
  };
  const handleLoadTopCategories = () => {
    api.get("categories").then((res) => {
      if (res.ok) {
        const tempTopCatData = res.data.slice(0, 6);
        setTopCategoriesData(tempTopCatData);
        setAllCategoriesData(res.data);
        dispatch({
          type: "SET_CATEGORIES_DATA",
          categories_data: res.data,
        });
      } else {
        if (res.problem === "CANCEL_ERROR") {
          return true;
        }
        // print error
        // TODO handle error
      }
    });
  };
  const handleSelectCategory = (item) => {
    setSearchData((prevSearchData) => {
      return {...prevSearchData, categories: item.term_id, page: 1};
    });
    dispatch({
      type: "SET_CAT_NAME",
      cat_name: [item.name],
    });
    setLoading(true);
  };

  const handleLayoutToggle = (layout) => {
    if (appSettings?.listView === layout) {
      return;
    }
    const tempSettings = {...appSettings, listView: layout};
    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });
    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
  };

  const Category = ({onPress, item}) => (
      <TouchableOpacity
          onPress={() => onPress(item)}
          style={{
            backgroundColor: COLORS.white,
            marginHorizontal: screenWidth * 0.015,
            marginBottom: screenWidth * 0.03,
            shadowColor: COLORS.border_light,
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: {
              height: 0,
              width: 0,
            },
            elevation: 1,
            borderRadius: 5,
          }}
      >
        <View
            style={{
              borderRadius: 5,
              alignItems: "center",
              paddingTop: "5%",
              justifyContent: "center",
              alignItems: "center",
              height: (screenWidth * 0.88 * 1.04) / 3,
              width: (screenWidth * 0.88) / 3,
              overflow: "hidden",
            }}
        >
          {item?.icon?.url ? (
              <CategoryImage size={(screenWidth * 0.88) / 9} uri={item.icon.url}/>
          ) : (
              <CategoryIcon
                  iconName={item.icon.class}
                  iconSize={(screenWidth * 0.88) / 9}
                  iconColor={COLORS.primary}
              />
          )}
          <View
              style={{
                paddingTop: "12%",
                alignItems: "center",
                paddingHorizontal: 5,
              }}
          >
            <Text
                style={{
                  color: COLORS.text_dark,
                  fontWeight: "bold",
                  fontSize: 13,
                  textAlign: "center",
                }}
                numberOfLines={2}
            >
              {decodeString(item.name)}
              {/* {decodeString(item.name).split(" ")[0]} */}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
  );
  const renderCategory = useCallback(
      ({item}) => <Category onPress={handleSelectCategory} item={item}/>,
      [refreshing, config]
  );

  const keyExtractor = useCallback((item, index) => `${index}`, []);

  const renderFeaturedItem = useCallback(
      ({item}) => (
          <ListingCard
              onPress={() =>
                  navigation.navigate(routes.listingDetailScreen, {
                    listingId: item.listing_id,
                  })
              }
              item={item}
          />
      ),
      [refreshing, config]
  );
  const renderFeaturedItemList = useCallback(
      ({item}) => (
          <ListingCardList
              onPress={() =>
                  navigation.navigate(routes.listingDetailScreen, {
                    listingId: item.listing_id,
                  })
              }
              item={item}
          />
      ),
      [refreshing, config]
  );

  const featuredListFooter = () => {
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

  const ListingListHeader = () => (
      <Animated.View>
        {!searchData?.categories && (
            <>
              <View
                  style={{
                    marginHorizontal: screenWidth * 0.015,
                    paddingVertical: 10,
                  }}
              >
                <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                    }}
                >
                  {__("homeScreenTexts.topCategoriesText", appSettings.lng)}
                </Text>
              </View>
              {/* categories flatlist */}
              <FlatList
                  data={topCategoriesData}
                  renderItem={renderCategory}
                  keyExtractor={keyExtractor}
                  showsHorizontalScrollIndicator={false}
                  inverted={rtl_support}
                  numColumns={3}
              />
              {allCategoriesData?.length > 6 && (
                  <TouchableOpacity
                      onPress={handleSeeAll}
                      style={{
                        backgroundColor: COLORS.primary,
                        alignItems: "center",
                        padding: 10,
                        marginVertical: 10,
                        borderRadius: 5,
                        marginHorizontal: screenWidth * 0.015,
                      }}
                  >
                    <Text
                        style={{
                          fontSize: 15,
                          color: COLORS.white,
                        }}
                    >
                      {__("homeScreenTexts.seAllButtonText", appSettings.lng)}
                    </Text>
                  </TouchableOpacity>
              )}
            </>
        )}
        {rtl_support ? (
            <View
                style={[
                  styles.featuredListingTop,
                  {marginTop: searchData?.categories ? 10 : 0},
                  rtlView,
                ]}
            >
              <View style={[{flex: 1, alignItems: "center"}, rtlView]}>
                <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                    }}
                    numberOfLines={1}
                >
                  {searchData?.categories
                      ? getSelectedCat(cat_name[0])
                      : __("homeScreenTexts.latestAdsText", appSettings.lng)}
                </Text>
                {!!searchData?.categories && (
                    <TouchableOpacity
                        style={{
                          paddingHorizontal: 5,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onPress={handleSeeAll}
                    >
                      <Text
                          style={{
                            fontSize: 12.5,
                            fontWeight: "bold",
                            color: COLORS.primary,
                          }}
                          numberOfLines={1}
                      >
                        {__("homeScreenTexts.selectCatBtn", appSettings.lng)}
                      </Text>
                    </TouchableOpacity>
                )}
              </View>
              <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
              >
                <TouchableOpacity
                    onPress={() => handleLayoutToggle(false)}
                    style={{
                      padding: 4,
                      borderRadius: 3,
                      borderWidth: 1,
                      backgroundColor: appSettings?.listView
                          ? COLORS.white
                          : COLORS.primary,
                      marginRight: 10,
                      borderColor: appSettings?.listView
                          ? COLORS.white
                          : COLORS.primary,
                    }}
                >
                  <Ionicons
                      name="grid"
                      size={15}
                      color={appSettings?.listView ? COLORS.gray : COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleLayoutToggle(true)}
                    style={{
                      padding: 4,
                      borderRadius: 3,
                      borderWidth: 1,
                      backgroundColor: appSettings?.listView
                          ? COLORS.primary
                          : COLORS.white,
                      borderColor: appSettings?.listView
                          ? COLORS.primary
                          : COLORS.white,
                    }}
                >
                  <Ionicons
                      name="list-sharp"
                      size={15}
                      color={appSettings?.listView ? COLORS.white : COLORS.gray}
                  />
                </TouchableOpacity>
              </View>
            </View>
        ) : (
            <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flex: 1,
                  paddingHorizontal: screenWidth * 0.015,
                  paddingBottom: 15,
                  paddingTop: 5,
                  // marginTop: searchData?.categories ? 10 : 0,
                }}
            >
              <View style={{flex: 1, flexDirection: "row", alignItems: "center"}}>
                <Text
                    style={[
                      {
                        fontSize: 15,
                        fontWeight: "bold",
                      },
                      // rtlText,
                    ]}
                    numberOfLines={1}
                >
                  {searchData?.categories
                      ? getSelectedCat(cat_name[0])
                      : __("homeScreenTexts.latestAdsText", appSettings.lng)}
                </Text>
                {!!searchData?.categories && (
                    <TouchableOpacity
                        style={{
                          paddingHorizontal: 5,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onPress={handleSeeAll}
                    >
                      <Text
                          style={[
                            {
                              fontSize: 12.5,
                              fontWeight: "bold",
                              color: COLORS.primary,
                            },
                            // rtlText,
                          ]}
                          numberOfLines={1}
                      >
                        {__("homeScreenTexts.selectCatBtn", appSettings.lng)}
                      </Text>
                    </TouchableOpacity>
                )}
              </View>
              <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
              >
                <TouchableOpacity
                    onPress={() => handleLayoutToggle(false)}
                    style={{
                      padding: 4,
                      borderRadius: 3,
                      borderWidth: 1,
                      backgroundColor: appSettings?.listView
                          ? COLORS.white
                          : COLORS.primary,
                      marginRight: 10,
                      borderColor: appSettings?.listView
                          ? COLORS.white
                          : COLORS.primary,
                    }}
                >
                  <Ionicons
                      name="grid"
                      size={15}
                      color={appSettings?.listView ? COLORS.gray : COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleLayoutToggle(true)}
                    style={{
                      padding: 4,
                      borderRadius: 3,
                      borderWidth: 1,
                      backgroundColor: appSettings?.listView
                          ? COLORS.primary
                          : COLORS.white,
                      borderColor: appSettings?.listView
                          ? COLORS.primary
                          : COLORS.white,
                    }}
                >
                  <Ionicons
                      name="list-sharp"
                      size={15}
                      color={appSettings?.listView ? COLORS.white : COLORS.gray}
                  />
                </TouchableOpacity>
              </View>
            </View>
        )}
      </Animated.View>
  );

  const handleSearch = (values) => {
    Keyboard.dismiss();
    if (values?.search?.trim()) {
      setSearchData((prevSearchData) => {
        return {...prevSearchData, search: values.search};
      });
      setLoading(true);
    } else {
      return;
    }
  };

  const handleReset = () => {
    setSearchData({
      categories: "",
      locations: "",
      onScroll: false,
      page: 1,
      per_page: paginationData?.home?.per_page || 20,
      search: "",
    });
    dispatch({
      type: "SET_SEARCH_LOCATIONS",
      search_locations: [],
    });
    dispatch({
      type: "SET_SEARCH_CATEGORIES",
      search_categories: [],
    });
  };

  const OnListingListScroll = (e) => {
    if (
        !scrollButtonVisible &&
        e.nativeEvent.contentOffset.y > screenHeight * 2
    ) {
      setScrollButtonVisible(true);
    }
    if (
        scrollButtonVisible &&
        e.nativeEvent.contentOffset.y < screenHeight * 2
    ) {
      setScrollButtonVisible(false);
    }
  };

  const getSelectedCat = (urg) => {
    return decodeString(urg);
  };

  const handleSeeAll = () => {
    navigation.navigate(routes.selectcategoryScreen, {
      data: allCategoriesData,
    });
  };

  const handleRetry = () => {
    setLoading(true);
    if (timedOut) setTimedOut(false);
  };

  const ListingListEmptyComponent = () => (
      <>
        {/* No Listing Found */}
        {!listingsData?.length && !timedOut && !networkError && (
            <View style={styles.noListingsWrap}>
              <Fontisto name="frowning" size={100} color={COLORS.primary_soft}/>
              <Text style={styles.noListingsMessage}>
                {__("homeScreenTexts.noListingsMessage", appSettings.lng)}
              </Text>
              <View style={styles.retryButton}>
                <AppButton
                    title={__("homeScreenTexts.refreshBtn", appSettings.lng)}
                    onPress={onRefresh}
                />
              </View>
            </View>
        )}
        {/* Timeout & Network Error notice */}
        {!listingsData?.length && (!!timedOut || !!networkError) && (
            <View style={styles.noListingsWrap}>
              <Fontisto name="frowning" size={100} color={COLORS.primary_soft}/>
              {!!timedOut && (
                  <Text style={styles.noListingsMessage}>
                    {__("homeScreenTexts.requestTimedOut", appSettings.lng)}
                  </Text>
              )}

              <View style={styles.retryButton}>
                <AppButton
                    title={__("homeScreenTexts.retryBtn", appSettings.lng)}
                    onPress={handleRetry}
                />
              </View>
            </View>
        )}
      </>
  );

  return (
      <View style={styles.container}>
        <TabScreenHeader style={{elevation: 0, zIndex: 2}} sideBar/>
        {/* Loading Animation */}
        {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={COLORS.primary}/>
            </View>
        ) : (
            <>
              {/* Search , Location , Reset button */}
              <View style={styles.listingTop}>
                {config.location_type === "local" && (
                    <>
                      <TouchableOpacity
                          disabled={timedOut || networkError}
                          style={styles.locationWrap}
                          onPress={() =>
                              navigation.navigate(routes.selectLocationScreen, {
                                data: locationsData,
                                type: "search",
                              })
                          }
                      >
                        <View style={[styles.locationContent, rtlView]}>
                          <FontAwesome5
                              name="map-marker-alt"
                              size={16}
                              color={COLORS.primary}
                          />
                          <Text
                              style={[styles.locationContentText, rtlTextA]}
                              numberOfLines={1}
                          >
                            {search_locations === null || !search_locations.length
                                ? __(
                                    "homeScreenTexts.selectLocationText",
                                    appSettings.lng
                                )
                                : search_locations.map((location) => location.name)[
                                search_locations.length - 1
                                    ]}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View style={{width: screenWidth * 0.015}}/>
                    </>
                )}
                <Formik initialValues={{search: ""}} onSubmit={handleSearch}>
                  {({
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      values,
                      setFieldValue,
                    }) => (
                      <View
                          style={[
                            styles.ListingSearchContainer,
                            config?.location_type === "geo" && {
                              marginLeft: screenWidth * 0.015,
                            },
                            rtlView,
                          ]}
                      >
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!values.search || timedOut || networkError}
                            style={
                              rtl_support
                                  ? {marginLeft: 7}
                                  : styles.listingSearchBtnContainer
                            }
                        >
                          <Feather
                              name="search"
                              size={20}
                              color={values.search ? COLORS.primary : COLORS.primary}
                          />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.searchInput, rtlTextA]}
                            placeholder={
                                searchData.search ||
                                __(
                                    "homeScreenTexts.listingSearchPlaceholder",
                                    appSettings.lng
                                )
                            }
                            placeholderTextColor={COLORS.text_gray}
                            onChangeText={handleChange("search")}
                            onBlur={() => {
                              handleBlur("search");
                            }}
                            value={values.search}
                            returnKeyType="search"
                            onSubmitEditing={handleSubmit}
                        />
                        <Pressable
                            style={{padding: 2}}
                            onPress={() => {
                              if (values.search) {
                                setFieldValue("search", "");
                              } else {
                                if (searchData.search) {
                                  Keyboard.dismiss();
                                  setSearchData((prevSearchData) => {
                                    return {...prevSearchData, search: ""};
                                  });
                                  setLoading(true);
                                }
                              }
                            }}
                        >
                          <Feather name="x" size={16} color={COLORS.primary}/>
                        </Pressable>
                      </View>
                  )}
                </Formik>
                {/* <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <FontAwesome name="refresh" size={18} color={COLORS.primary} />
            </TouchableOpacity> */}
              </View>
              {/* FlatList */}
              <View
                  style={{
                    paddingHorizontal: screenWidth * 0.015,

                    flex: 1,
                  }}
              >
                {
                  <FlatList
                      key={appSettings?.listView ? "list" : "grid"}
                      data={listingsData}
                      renderItem={
                        appSettings?.listView
                            ? renderFeaturedItemList
                            : renderFeaturedItem
                      }
                      keyExtractor={keyExtractor}
                      horizontal={false}
                      showsVerticalScrollIndicator={false}
                      onEndReached={handleNextPageLoading}
                      onEndReachedThreshold={1}
                      ListFooterComponent={featuredListFooter}
                      numColumns={appSettings?.listView ? 1 : 2}
                      maxToRenderPerBatch={appSettings?.listView ? 15 : 8}
                      windowSize={appSettings?.listView ? 41 : 61}
                      onScroll={OnListingListScroll}
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      contentContainerStyle={{
                        paddingBottom: screenHeight - windowHeight,
                      }}
                      ListHeaderComponent={ListingListHeader}
                      scrollEventThrottle={1}
                      ref={iosFlatList}
                      ListEmptyComponent={ListingListEmptyComponent}
                  />
                }
                {scrollButtonVisible && (
                    <TouchableOpacity
                        style={{
                          height: 40,
                          width: 40,
                          backgroundColor: COLORS.bg_dark,
                          alignItems: "center",
                          justifyContent: "center",
                          position: "absolute",
                          bottom: 10,
                          right: 15,
                          borderRadius: 40 / 2,
                          shadowRadius: 5,
                          shadowOpacity: 0.3,
                          shadowOffset: {
                            height: 2,
                            width: 2,
                          },
                          shadowColor: "#000",
                          paddingBottom: 3,
                          elevation: 5,
                        }}
                        onPress={() =>
                            iosFlatList.current.scrollToOffset({
                              animated: true,
                              offset: 0,
                            })
                        }
                    >
                      <FontAwesome
                          name="chevron-up"
                          size={20}
                          color={COLORS.primary}
                      />
                    </TouchableOpacity>
                )}
              </View>
              {/* Flash notification */}
              <FlashNotification
                  falshShow={flashNotification}
                  flashMessage="Hello World!"
              />
            </>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  admobOverLay: {
    flex: 1,
    backgroundColor: COLORS.primary_soft,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: windowHeight * 0.03,
  },
  admobOverLayText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
  },
  categoriesRowWrap: {},
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_dark,
  },
  featuredListingTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: screenWidth * 0.015,
    paddingBottom: 15,
    paddingTop: 5,
  },
  itemSeparator: {
    height: "100%",
    width: 1.333,
    backgroundColor: COLORS.bg_dark,
  },
  listingSearchBtnContainer: {
    marginRight: 7,
  },
  ListingSearchContainer: {
    flex: 1,
    height: 34,
    backgroundColor: COLORS.white,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 7,
  },
  listingTop: {
    backgroundColor: COLORS.primary,
    width: "100%",
    marginTop: -1,
    paddingTop: 5,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: screenWidth * 0.03,
    paddingBottom: 15,
  },
  locationWrap: {
    maxWidth: screenWidth * 0.25,
    backgroundColor: COLORS.white,
    borderRadius: 5,
    padding: 7,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  locationContentText: {
    paddingHorizontal: 5,
    color: COLORS.text_gray,
  },
  loadMoreWrap: {
    marginBottom: 10,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    height: screenHeight - 120,
  },
  noListingsMessage: {
    fontSize: 18,
    color: COLORS.text_gray,
    marginVertical: 10,
  },
  noListingsWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  resetButton: {
    borderRadius: 5,
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: screenWidth * 0.015,
  },
  retryButton: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
  },
  selectedCat: {
    fontSize: 12,
  },
  topCatSliderWrap: {
    position: "absolute",
    top: 94,
    zIndex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
});

export default HomeScreen;