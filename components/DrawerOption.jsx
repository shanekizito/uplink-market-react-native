import React from "react";
import {View, Text, StyleSheet, TouchableWithoutFeedback} from "react-native";
import {useStateValue} from "../StateProvider";
import {COLORS} from "../variables/color";
import ChevronRightIcon from "./svgComponents/ChevronRightIcon";
import SellFasterIcon from "./svgComponents/SellFasterIcon";
import AboutUsIcon from "./svgComponents/AboutUsIcon";
import GearIcon from "./svgComponents/GearIcon";
import FAQIcon from "./svgComponents/FAQIcon";
import TnCIcon from "./svgComponents/TnCIcon";
import PPIcon from "./svgComponents/PPIcon";
import ContactUsIcon from "./svgComponents/ContactUsIcon";
import ShopIcon from "./svgComponents/ShopIcon";
import {miscConfig} from "../app/services/miscConfig";

const DrawerOption = ({item, isLast, navigation}) => {
  const [{rtl_support, config, ios}] = useStateValue();

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };

  const getIcon = () => {
    if (item?.id === "about") {
      return <AboutUsIcon fillColor={COLORS.primary}/>;
    } else if (item?.id === "contact") {
      return <ContactUsIcon fillColor={COLORS.primary}/>;
    } else if (item?.id === "faq") {
      return <FAQIcon fillColor={COLORS.primary}/>;
    } else if (item?.id === "how_to_sell_fast") {
      return <SellFasterIcon fillColor={COLORS.primary}/>;
    } else if (item?.id === "pp") {
      return <PPIcon fillColor={COLORS.primary}/>;
    } else if (item?.id === "settings") {
      return <GearIcon fillColor={COLORS.primary}/>;
    } else if (item?.id === "tnc") {
      return <TnCIcon fillColor={COLORS.primary}/>;
    } else if (item?.id === "all_stores") {
      return <ShopIcon fillColor={COLORS.primary}/>;
    }
  };

  const onDrawerOptionClick = async () => {
    navigation.navigate(item.routeName);
  };

  if (item?.id === "all_stores" && !config?.store_enabled) {
    return null;
  } else {
    return (
        <TouchableWithoutFeedback onPress={onDrawerOptionClick}>
          <View
              style={[
                styles.container,
                !isLast && {
                  borderBottomColor: "#e3e3e3",
                  borderBottomWidth: 1,
                },
              ]}
          >
            <View style={styles.view}>{getIcon()}</View>
            <View style={{flex: 1, paddingHorizontal: 10}}>
              <Text
                  style={[
                    {
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                    rtlText,
                  ]}
              >
                {item.title}
              </Text>
            </View>
            <View style={styles.view}>
              <ChevronRightIcon fillColor={COLORS.gray}/>
            </View>
          </View>
        </TouchableWithoutFeedback>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
});

export default DrawerOption;