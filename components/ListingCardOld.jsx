import React from "react";
import {
  Dimensions,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Image,
} from "react-native";

// Vector Fonts
import {FontAwesome5} from "@expo/vector-icons";

// Custom Components & Constants
import {decodeString, getPrice} from "../helper/helper";
import {COLORS} from "../variables/color";
import {useStateValue} from "../StateProvider";
import Badge from "./Badge";
import {__} from "../language/stringPicker";
import ListAdComponent from "./ListAdComponent";
import {admobConfig} from "../app/services/adMobConfig";

const {width: screenWidth} = Dimensions.get("screen");

const listingCardFallbackImageUrl = require("../assets/100x100.png");

const ListingCard = ({onPress, item}) => {
  const [{config, ios, appSettings, rtl_support}] = useStateValue();

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };

  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  const getTexonomy = (items) => {
    if (!items?.length) return false;
    return decodeString(items[items.length - 1].name);
  };
  const getBackgroundColor = () => {
    if (!item?.badges?.length > 0) {
      return null;
    } else {
      if (item?.badges?.includes("is-top")) {
        return COLORS.cardBg["_top"];
      } else if (item?.badges?.includes("is-featured")) {
        return COLORS.cardBg["featured"];
      }
    }
  };

  return item.listAd && admobConfig?.admobEnabled ? (
      <ListAdComponent dummy={item.dummy}/>
  ) : (
      <View
          style={{
            shadowColor: "#000",
            shadowRadius: 4,
            shadowOpacity: 0.2,
            shadowOffset: {
              height: 2,
              width: 2,
            },
          }}
      >
        <TouchableWithoutFeedback onPress={onPress}>
          <View
              style={[
                styles.featuredItemWrap,
                {
                  backgroundColor: getBackgroundColor()
                      ? getBackgroundColor()
                      : COLORS.white,
                  flex: 1,
                },
              ]}
          >
            {item?.badges?.includes("is-bump-up") && (
                <View style={styles.badgeSection}>
                  <Badge badgeName="is-bump-up" type="card"/>
                </View>
            )}
            {item?.badges?.includes("is-sold") && (
                <View
                    style={[
                      styles.soldOutBadge,
                      {
                        top: ios ? "8%" : "6%",
                        left: ios ? "54%" : "56%",
                        width: ios ? "60%" : "60%",
                      },
                    ]}
                >
                  <Text style={styles.soldOutBadgeMessage}>
                    {__("listingCardTexts.soldOutBadgeMessage", appSettings.lng)}
                  </Text>
                </View>
            )}
            {item?.badges?.includes("is-bump-up") && (
                <View style={styles.bumpUpBadge}></View>
            )}

            <View style={styles.featuredItemImageWrap}>
              <Image
                  style={styles.featuredItemImage}
                  source={
                    item?.images?.length
                        ? {
                          uri: item.images[0].sizes.thumbnail.src,
                        }
                        : listingCardFallbackImageUrl
                  }
              />
            </View>
            <View
                style={[
                  styles.featuredItemDetailWrap,
                  {alignItems: rtl_support ? "flex-end" : "flex-start"},
                ]}
            >
              <Text
                  style={[
                    styles.featuredItemCategory,
                    {paddingBottom: ios ? 3 : 1},
                    rtlText,
                  ]}
                  numberOfLines={1}
              >
                {getTexonomy(item.categories)}
              </Text>
              <Text
                  style={[
                    styles.featuredItemTitle,
                    {paddingBottom: ios ? 3 : 1},
                    rtlTextA,
                  ]}
                  numberOfLines={1}
              >
                {decodeString(item.title)}
              </Text>
              {(!!item?.contact?.locations?.length ||
                  !!item?.contact?.geo_address) && (
                  <>
                    {config.location_type === "local" ? (
                        <>
                          {!!item?.contact?.locations?.length && (
                              <View
                                  style={[
                                    styles.featuredItemLocationWrap,
                                    {paddingBottom: ios ? 5 : 3},
                                    rtlView,
                                  ]}
                              >
                                <FontAwesome5
                                    name="map-marker-alt"
                                    size={10}
                                    color={COLORS.text_gray}
                                />
                                <Text style={[styles.featuredItemLocation, rtlTextA]}>
                                  {getTexonomy(item.contact.locations)}
                                </Text>
                              </View>
                          )}
                        </>
                    ) : (
                        <>
                          {!!item?.contact?.geo_address && (
                              <View
                                  style={[
                                    styles.featuredItemLocationWrap,
                                    {paddingBottom: ios ? 5 : 3},
                                    rtlView,
                                  ]}
                              >
                                <FontAwesome5
                                    name="map-marker-alt"
                                    size={10}
                                    color={COLORS.text_gray}
                                />
                                <Text
                                    style={[styles.featuredItemLocation, rtlTextA]}
                                    numberOfLines={1}
                                >
                                  {decodeString(item.contact.geo_address)}
                                </Text>
                              </View>
                          )}
                        </>
                    )}
                  </>
              )}
              {config?.available_fields?.listing.includes("price") && (
                  <Text
                      style={[styles.featuredItemPrice, rtlText]}
                      numberOfLines={1}
                  >
                    {getPrice(
                        item?.currency
                            ? {
                              ...config.currency,
                              ...item.currency,
                            }
                            : config.currency,
                        {
                          pricing_type: item.pricing_type,
                          price_type: config?.available_fields?.listing.includes(
                              "price_type"
                          )
                              ? item?.price_type || null
                              : null,
                          price: item.price,
                          max_price: item.max_price,
                          price_unit: item.price_unit,
                          price_units: item.price_units,
                        },
                        appSettings.lng
                    )}
                  </Text>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
  );
};
const styles = StyleSheet.create({
  badgeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    margin: 2,
  },
  badgeStyle: {
    padding: 3,
    elevation: 5,
  },
  badgeTextStyle: {
    color: COLORS.white,
    fontSize: 12,
  },
  bumpUpBadge: {
    height: 20,
    width: 20,
    backgroundColor: COLORS.badges["is-bump-up"],
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  container: {},
  featuredListingTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "3%",

    marginVertical: 10,
  },
  featuredItemCategory: {
    fontSize: 12,
    color: COLORS.text_gray,
  },
  featuredItemDetailWrap: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    overflow: "hidden",
  },
  featuredItemImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  featuredItemImageWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
    height: screenWidth * 0.455,
  },
  featuredItemLocation: {
    color: COLORS.text_gray,
    fontSize: 12,
    paddingHorizontal: 5,
  },
  featuredItemLocationWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 2,
  },
  featuredItemPrice: {
    color: COLORS.primary,
    fontSize: 14.5,
    fontWeight: "bold",
  },
  featuredItemTitle: {
    fontSize: 13.5,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  featuredItemWrap: {
    marginHorizontal: screenWidth * 0.015,
    overflow: "hidden",
    borderRadius: 3,
    marginBottom: screenWidth * 0.03,
    width: screenWidth * 0.455,
    elevation: 4,
  },
  soldOutBadge: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    transform: [{rotate: "45deg"}],

    flex: 1,
    elevation: 7,
    zIndex: 20,
    shadowColor: "#000",
    shadowRadius: 4,
    shadowOpacity: 0.2,
    shadowOffset: {
      height: 2,
      width: 2,
    },
  },
  soldOutBadgeMessage: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default ListingCard;