import BigNumber from "bignumber.js";

import React from 'react';

import { NativeModules, Text, View } from "react-native"
import { SvgUri } from 'react-native-svg';
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

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
  leadingZero: boolean;
  updatePaymentValues: Function;
  selectedPaymentType: {
    name: string;
    ticker: string;
    tokenID: string;
    decimal_count: number;
    imagePath: string;
  } | null;
}

interface BchInputState {
  decimalPressed: boolean;
}

export default class BchInput extends React.Component<Props, State> {
  state: BchInputState = {
    decimalPressed: false,
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
    const stringValue = this.setStringValue(floatObj);
    const isValid = {
      isValid: this.checkValid(floatObj),
    };
    // const payload = this.constructBip70Payload();
    updatePaymentValues({
      ...floatObj,
      ...stringValue,
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
  //       decimalPressed: false,
  //     };
  //   } else {
  //     floatObj = {
  //       floatVal: 0,
  //       bigNumber: big,
  //       decimalPressed: false,
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
      leadingZero: false,
    };
    const stringValue = this.setStringValue(floatObj);
    const isValid = {isValid: false};
    updatePaymentValues({
      ...floatObj,
      ...stringValue,
      ...isValid,
    });
    this.setState({
      decimalPressed: false
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
    const {decimalPressed} = this.state;
    const {floatVal, bigNumber, leadingZero} = this.props;
    let concat: string;
    concat = `${floatVal}${val}`;

    const canEdit = this.checkCanEdit(concat);

    let setZero = false;

    if (decimalPressed) {
      const containsDecimal = /\./.test(concat);
      if (!containsDecimal) {
        if (leadingZero) {
          concat = `${floatVal}.0${val}`;
        } else {
          concat = `${floatVal}.${val}`;
        }
        if (val === 0) {
          setZero = true;
        }
      }
    }

    if (canEdit) {
      const big = new BigNumber(concat);

      return {
        floatVal: parseFloat(concat),
        bigNumber: big,
        leadingZero: setZero,
      };
    } else {
      return {
        floatVal: floatVal,
        bigNumber: bigNumber,
        leadingZero: setZero,
      };
    }
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

  handleDecimal = () => {
    const length: number = this.getFiatDecimalPlaces();
    if (length > 0) {
      this.setState({
        decimalPressed: true
      });
    }
  };

  render(): JSX.Element {
    const { companyName } = this.props;
    const { stringValue, addSelection, selectedPaymentType } = this.props;

    return (
      <Container >
        <NavigationEvents
          onWillFocus={async () => {
            await this.clearInput();
          }}
        />
        <CompanyNameText>{companyName && companyName}</CompanyNameText>
        <Display stringValue={stringValue} />

        <Keypad
          updateInput={this.updateInput}
          clearInput={this.clearInput}
          handleDecimal={this.handleDecimal}
        />

        <Payment
          addSelection={addSelection}
          selectedPaymentType={selectedPaymentType}
          constructBip70Payload={this.constructBip70Payload}
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
  font-size: ${wp('3%')};
  color: ${defaultTheme};
  margin-top:${hp('2%')};
`;




export const BchInputConsumer = Consumer;