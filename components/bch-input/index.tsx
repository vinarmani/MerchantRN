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
  markValid: Function;
  markInvalid: Function;
  isValid: Boolean;
  updateBip70Payload: Function;
}

interface BchInputState {
  floatVal: number;
  bigNumber: any;
  stringValue: string;
  currency: string;
  decimalPressed: boolean;
  leadingZero: boolean;
  selectedPaymentType: {
    name: string;
    ticker: string;
    tokenID: string;
    decimal_count: number;
    imagePath: string;
  } | null;
}

export default class BchInput extends React.Component<Props, State> {
  state: BchInputState = {
    floatVal: 0,
    bigNumber: new BigNumber(0),
    stringValue: '$0.00',
    currency: 'USD',
    decimalPressed: false,
    leadingZero: false,
    selectedPaymentType: null,
  };

  // componentDidMount = async () => {

  // };

  getFiatDecimalPlaces = () => {
    // hardcode USD

    const { currency } = this.state;
    return 2;
  };

  setStringValue = async (floatObj: object | undefined) => {
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

  updateInput = async (val: number) => {
    const floatObj = await this.updateIntVal(val);
    const stringValue = await this.setStringValue(floatObj);
    this.setState({
      ...floatObj,
      ...stringValue,
    })
    this.checkValid();
    await this.constructBip70Payload();
  };

  deleteInput = async () => {
    const { floatVal } = this.state;
    const floatString = floatVal.toString().slice(0, -1);

    const int = parseFloat(floatString);
    const big = new BigNumber(floatString);
    let floatObj;
    if (!isNaN(int)) {
      floatObj = {
        floatVal: int,
        bigNumber: big,
        decimalPressed: false,
      };
    } else {
      floatObj = {
        floatVal: 0,
        bigNumber: big,
        decimalPressed: false,
      };
    }
    const stringValue = await this.setStringValue(floatObj);
    this.setState({
      ...floatObj,
      ...stringValue,
    });
    this.checkValid();
  };

  clearInput = async () => {
    const { markInvalid } = this.props;
    const big = new BigNumber(0);
    const floatObj = {
      floatVal: 0,
      bigNumber: big,
      decimalPressed: false,
      leadingZero: false,
    };
    const stringValue = await this.setStringValue(floatObj);
    this.setState({
      ...floatObj,
      ...stringValue,
    });
    markInvalid();
  };

  checkValid = () => {
    const { markValid, markInvalid, isValid } = this.props;
    const { bigNumber } = this.state;

    try {
      const value = bigNumber.c[0];
      if (value > 0 && !isValid) {
        markValid();
      }
    } catch (error) {
      if (isValid) {
        markInvalid();
      }
    }
  };

  updateIntVal = async (val: number) => {
    const { floatVal, decimalPressed, bigNumber, leadingZero } = this.state;
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

  addSelection = async (data: object) => {
    this.setState({ selectedPaymentType: data });
  };

  getBCHPrice = async () => {
    const {
      data: {
        data: { priceUsd }
      }
    }: AxiosResponse = await axios.get(
      'https://api.coincap.io/v2/assets/bitcoin-cash'
    );

    return priceUsd;
  };

  getSpiceAmount = async (fiatValue: number) => {
    const {
      data: { spicePrice }
    }: AxiosResponse = await axios.get(
      'https://api.cryptophyl.com/products/SPICE-BCH/ticker'
    );

    const bchPrice = await this.getBCHPrice();

    const bchCost = fiatValue / parseFloat(bchPrice);

    const spiceAmount = bchCost / spicePrice;

    return parseFloat(spiceAmount.toFixed(8));
  };

  getUsdhAmount = (fiatValue: number) => {
    return parseFloat(fiatValue.toFixed(2));
  };


  constructBip70Payload = async () => {
    const {
      floatVal,
      stringValue,
      selectedPaymentType: { tokenID },
      currency
    } = this.state;
    const { updateBip70Payload, companyName } = this.props;
    const decimalPlaces: number = this.getFiatDecimalPlaces();

    const isSLP = tokenID !== '';

    if (isSLP) {
      // const spiceAmount = await this.getSpiceAmount(floatVal);
      const usdhAmount = this.getUsdhAmount(floatVal);

      const userMemo = 'Payment of ' + usdhAmount + ' USDH to ' + companyName;

      const slpTxRequest: {
        token_id: string;
        slp_outputs: { address: string; amount: number }[];
        memo?: string;
        fiatTotal?: number;
      } = {
        token_id: tokenID,
        slp_outputs: [
          {
            address: '1MyNBB5nmjs2ktLNqLmSmQdpuAF71sspWg', // Legacy only
            amount: usdhAmount,
          },
        ],
        memo: userMemo,
        fiatTotal: usdhAmount,
      };
      return updateBip70Payload(slpTxRequest);
    } else {
      const fiatTotal = floatVal.toFixed(decimalPlaces);
      const userMemo =
        'Payment of $' + fiatTotal + ' worth of BCH to ' + companyName;

      const bchPrice = await this.getBCHPrice()
      const bchAmount = parseFloat(fiatTotal) / parseFloat(bchPrice);

      const bchTxRequest: {
        outputs: {
          script?: string;
          amount?: number;
          fiatAmount?: any;
          address?: string;
        }[];
        currency?: string;
        fiat?: string;
        fiatRate?: number;
        memo?: string;
        fiatTotal?: number;
      } = {
        fiat: currency,
        outputs: [
          // {
          //   script: "76a914018a532856c45d74f7d67112547596a03819077188ac",
          //   amount: 700
          // },
          {
            address: '1MyNBB5nmjs2ktLNqLmSmQdpuAF71sspWg', // Legacy only
            amount: Math.ceil(bchAmount * 100000000),
            //fiatAmount: floatVal.toFixed(decimalPlaces)
          }
        ],
        memo: userMemo,
        fiatTotal: parseFloat(fiatTotal),
      };

      return updateBip70Payload(bchTxRequest);
    }
  };

  render(): JSX.Element {
    const { companyName } = this.props;
    const { selectedPaymentType } = this.state;

    return (
      <Container >
        <NavigationEvents
          onWillFocus={async () => {
            await this.clearInput()
          }}
        />
        <CompanyNameText>{companyName && companyName}</CompanyNameText>
        <Display parentState={this.state} />

        <Keypad
          updateInput={this.updateInput}
          clearInput={this.clearInput}
          handleDecimal={this.handleDecimal}
        />

        <Payment
          addSelection={this.addSelection}
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