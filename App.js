import React, {useEffect} from "react";
import "expo-dev-client";
import {NavigationContainer} from "@react-navigation/native";
import {LogBox} from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";

// Custom Components
import Screen from "./components/Screen";
import HomeNavigator from "./navigation/HomeNavigator";
import {StateProvider} from "./StateProvider";
import reducer, {initialState} from "./reducer";

// import mobileAds from "react-native-google-mobile-ads";
// import { Settings } from "react-native-fbsdk-next";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  const prefix = Linking.createURL("/");
  useEffect(() => {
    // Settings.initializeSDK();
    // mobileAds()
    //   .initialize()
    //   .then((adapterStatuses) => {});
  }, []);

  LogBox.ignoreLogs([
    "[expo-notifications] Error encountered while updating server registration with latest device push token. ",
    "Possible Unhandled Promise Rejection (id: 0):",
    "WARNING: You've enabled `dangerouslyGetFullCardDetails`,",
    "w NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.",
    "`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.",
    "EventEmitter.removeListener('keyboardDidShow', ...): Method has been deprecated. Please instead use `remove()` on the subscription returned by `EventEmitter.addListener`",
    "EventEmitter.removeListener('url', ...): Method has been deprecated. Please instead use `remove()` on the subscription returned by `EventEmitter.addListener`.",
    'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  ]);

  return (
      <StateProvider initialState={initialState} reducer={reducer}>
        <Screen>
          <NavigationContainer
              linking={{
                prefixes: [prefix],
                config: {
                  screens: {
                    initialRouteName: "Tabs",
                    Tabs: {
                      screens: {
                        Home: "home",
                        Chats: "chats",
                        Account: "account",
                      },
                    },
                    "Listing Detail": {
                      path: "listings/:listingId",
                      parse: {
                        listingId: Number,
                      },
                    },
                    "My Listings": "myListings",
                    Chatsingle: {
                      path: "conversation/:con_id/:listing_id",
                      parse: {
                        con_id: Number,
                        listing_id: Number,
                      },
                    },
                  },
                },
                async getInitialURL() {
                  // First, you may want to do the default deep link handling
                  // Check if app was opened from a deep link
                  const url1 = await Linking.getInitialURL();

                  if (url1 != null) {
                    return url1;
                  }

                  // Handle URL from expo push notifications
                  const response =
                      await Notifications.getLastNotificationResponseAsync();
                  const url = response?.notification.request.content.data.url;
                  return url;
                },
                subscribe(listener) {
                  const onReceiveURL = ({url}) => listener(url);

                  // Listen to incoming links from deep linking
                  const eventListenerSubscription = Linking.addEventListener(
                      "url",
                      onReceiveURL
                  );

                  // Listen to expo push notifications
                  const subscription =
                      Notifications.addNotificationResponseReceivedListener(
                          (response) => {
                            const url = response.notification.request.content.data.url;

                            // Any custom logic to see whether the URL needs to be handled

                            // Let React Navigation handle the URL
                            listener(url);
                          }
                      );

                  return () => {
                    // Clean up the event listeners
                    eventListenerSubscription.remove();
                    subscription.remove();
                  };
                },
              }}
          >
            <HomeNavigator/>
          </NavigationContainer>
        </Screen>
      </StateProvider>
  );
};

export default App;