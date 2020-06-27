import BigNumber from "bignumber.js";

import React from 'react';

import {
  NativeModules,
  Dimensions,
  Button,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import QRCodeScanner from "react-native-qrcode-scanner";
import axios, { AxiosResponse } from "axios";
import { Display } from "./display";
import { Keypad } from "./keypad";
import { Payment } from "./payment";

const { Consumer } = React.createContext('');

import { NavigationEvents } from 'react-navigation';

const deviceLanguage =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale
    : NativeModules.I18nManager.localeIdentifier;

const defaultTheme = '#5451c9';

export interface BchInputProps {
  companyName: string;
  addSelection: Function;
  isValid: Boolean;
  stringValue: string;
  floatVal: number;
  bigNumber: any;
  centString: string;
  updatePaymentValues: Function;
  setOptionalOutput: Function;
  selectedPaymentType: {
    name: string;
    ticker: string;
    tokenID: string;
    decimal_count: number;
    imagePath: string;
  } | null;
}

interface BchInputState {
  qrOpen: boolean;
}

export default class BchInput extends React.Component<Props, State> {
  state: BchInputState = {
    qrOpen: false,
  };

  // componentDidMount = async () => {

  // };

  getFiatDecimalPlaces = () => {
    // hardcode USD
    return 2;
  };

  setStringValue = (floatObj: object | undefined) => {
    if (!floatObj) {
      return { stringValue: '$0.00' };
    }
    const { floatVal } = floatObj;

    const length: number = this.getFiatDecimalPlaces();
    const big = new BigNumber(floatVal);
    const fixed: any = big.toFixed(length);

    const locale = deviceLanguage.replace("_", "-");

    // const currencyString = new Intl.NumberFormat(locale, {
    //   style: "currency",
    //   currency: currency
    // }).format(fixed);

    const currencyString = '$' + fixed.toString();

    return { stringValue: currencyString };
  };

  updateInput = (val: number) => {
    const {updatePaymentValues} = this.props;
    const floatObj = this.updateIntVal(val);
    const isValid = {
      isValid: this.checkValid(floatObj),
    };
    updatePaymentValues({
      ...floatObj,
      ...isValid,
    });
  };

  // deleteInput = async () => {
  //   const { floatVal } = this.state;
  //   const floatString = floatVal.toString().slice(0, -1);

  //   const int = parseFloat(floatString);
  //   const big = new BigNumber(floatString);
  //   let floatObj;
  //   if (!isNaN(int)) {
  //     floatObj = {
  //       floatVal: int,
  //       bigNumber: big,
  //     };
  //   } else {
  //     floatObj = {
  //       floatVal: 0,
  //       bigNumber: big,
  //     };
  //   }
  //   const stringValue = this.setStringValue(floatObj);
  //   this.setState({
  //     ...floatObj,
  //     ...stringValue,
  //   });
  //   this.checkValid(floatObj);
  // };

  clearInput = async () => {
    const {updatePaymentValues} = this.props;
    const big = new BigNumber(0);
    const floatObj = {
      floatVal: 0,
      bigNumber: big,
      centString: '',
    };
    const stringValue = this.setStringValue(floatObj);
    const isValid = {isValid: false};
    const optionalOutput = {optionalOutput: null}
    updatePaymentValues({
      ...floatObj,
      ...stringValue,
      ...isValid,
      ...optionalOutput,
    });
  };

  checkValid = (floatObj) => {
    const { isValid } = this.props;
    const { bigNumber } = floatObj;

    try {
      const value = bigNumber.c[0];
      if (value > 0) {
        return true;
      }
    } catch (error) {
      if (isValid) {
        return false;
      }
    }
  };

  updateIntVal = (val: number) => {
    const {centString} = this.props;
    let cents: string;
    cents = `${centString}${val}`;
    const decimalPlaces = this.getFiatDecimalPlaces();
    const fiatValue = parseInt(cents, 10) / (10 ** decimalPlaces);

    const big = new BigNumber(fiatValue);

    return {
      floatVal: parseFloat(fiatValue),
      bigNumber: big,
      stringValue: '$' + big.toFixed(decimalPlaces),
      centString: cents,
    };
  };

  checkCanEdit = (concat: string) => {
    const length: number = this.getFiatDecimalPlaces();
    let split: any = concat.split(".");
    let decimalPlaces: number = 0;
    if (split[1] !== undefined) {
      decimalPlaces = split[1].length;
    }

    if (decimalPlaces <= length) {
      return true;
    }
    return false;
  };

  handleNamePress = () => {
    console.log('name long press');
  };

  setQrOpen = (isOpen: boolean) => {
    this.setState({qrOpen: isOpen});
  };

  render(): JSX.Element {
    const { qrOpen } = this.state;
    const {
      stringValue,
      addSelection,
      selectedPaymentType,
      companyName,
      setOptionalOutput,
    } = this.props;

    return (
      <Container >
        <NavigationEvents
          onWillFocus={async () => {
            await this.clearInput();
          }}
        />

        {qrOpen && (
          <QROverlayScreen>
            <Text>Scan QR Code</Text>

            <View
              style={{
                height: Dimensions.get('window').width - 12,
              }}>
              <QRCodeScanner
                cameraProps={{
                  ratio: '1:1',
                  captureAudio: false
                }}
                fadeIn={false}
                onRead={e => {
                  const qrData = e.data;

                  if (qrData) {
                    setOptionalOutput(qrData);
                  }

                  this.setQrOpen(false);
                }}
                cameraStyle={{
                  height: Dimensions.get('window').width - 32,
                  width: Dimensions.get('window').width - 32,
                }}
              />
            </View>
            <Button onPress={() => this.setQrOpen(false)} title="Cancel Scan" />
          </QROverlayScreen>
        )}

        <TouchableOpacity onLongPress={() => this.setQrOpen(true)}>
          <CompanyNameText>{companyName && companyName}</CompanyNameText>
        </TouchableOpacity>
        <Display stringValue={stringValue} />

        <Keypad updateInput={this.updateInput} clearInput={this.clearInput} />

        <Payment
          addSelection={addSelection}
          selectedPaymentType={selectedPaymentType}
        />
      </Container>
    );
  }
}


const Container = styled.View`
  flex: 1;
  background-color: #FBFCFF;
`;


const CompanyNameText = styled.Text`
  text-align:center;
  font-weight: 100;
  font-size: ${wp('5%')};
  color: ${defaultTheme};
  margin-top:${hp('2%')};
`;

const QROverlayScreen = styled(View)`
  position: absolute;
  padding: 0 16px;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: ${Dimensions.get('window').width}px;
  height: ${Dimensions.get('window').height}px;
  z-index: 1;
  background-color: black;
`;

export const BchInputConsumer = Consumer;