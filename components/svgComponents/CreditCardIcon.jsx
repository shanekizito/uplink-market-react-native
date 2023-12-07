import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";

const CreditCardIcon = (props) => (
  <Svg
    width={18}
    height={18}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Rect
      width={16.5}
      height={10}
      rx={2}
      fill={props.fillColor}
      stroke={props.fillColor}
      strokeWidth={1.5}
    />
    <Path
      d="M1.5 11.25V15a.75.75 0 0 0 .75.75h14.25a.75.75 0 0 0 .75-.75v-3.75"
      stroke={props.fillColor}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default CreditCardIcon;
