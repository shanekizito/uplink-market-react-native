import React, {useState} from "react";
import {View, TouchableOpacity, Text, ActivityIndicator} from "react-native";

// External Libraries
import DraggableFlatList from "react-native-draggable-flatlist";

// Custom Components & Constants
import ImageInput from "./ImageInput";
import {useStateValue} from "../StateProvider";
import {__} from "../language/stringPicker";
import {AntDesign} from "@expo/vector-icons";
import {COLORS} from "../variables/color";

const ImageInputList = ({
                          imageUris = [],
                          onRemoveImage,
                          onAddImage,
                          maxCount,
                          reorder,
                        }) => {
  const [{appSettings}] = useStateValue();
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const renderImageItem = ({item, drag, isActive, index}) => {
    return (
        <ImageInput
            imageUri={item}
            onChangeImage={() => onRemoveImage(item)}
            drag={drag}
            active={isActive}
            display={true}
            index={index}
        />
    );
  };

  return (
      <View
          style={{
            marginVertical: !imageUris.length ? 15 / 2 : 15,
          }}
      >
        <DraggableFlatList
            ListHeaderComponent={
                imageUris.length < maxCount && (
                    <ImageInput
                        onChangeImage={(data) => {
                          setPhotoModalVisible(false);
                          onAddImage(data);
                        }}
                        addingImage={photoModalVisible}
                        closePhotoModal={() => setPhotoModalVisible(false)}
                        display={false}
                    />
                )
            }
            data={imageUris}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => `draggable-item-${index}`}
            onDragEnd={({data}) => {
              reorder(data);
            }}
            horizontal
        />
      </View>
  );
};

export default ImageInputList;