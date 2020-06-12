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
import { BchInputProps } from './index';

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
  updateBip70Payload: Function;
}

interface BchInputState {
  floatVal: number;
  bigNumber: any;
  stringValue: string;
  currency: string;
  decimalPressed: boolean;
  selectedPaymentType: {
    name: string;
    ticker: string;
    tokenID: string;
    decimal_count: number;
    imagePath: string;
  };
}


export default class BchInput extends React.Component<Props, State> {
  state: BchInputState = {
    floatVal: 0,
    bigNumber: {},
    stringValue: "---",
    currency: "USD",
    decimalPressed: false,
    selectedPaymentType: null
  };

  componentDidMount = async () => {

  };

  getFiatDecimalPlaces = () => {
    // hardcode USD

    const { currency } = this.state;
    return 2;
  };

  setStringValue = async () => {
    const { currency, floatVal, bigNumber } = this.state;

    const length: number = this.getFiatDecimalPlaces();
    const big = new BigNumber(floatVal);
    const fixed: any = big.toFixed(length);

    const locale = deviceLanguage.replace("_", "-");

    // const currencyString = new Intl.NumberFormat(locale, {
    //   style: "currency",
    //   currency: currency
    // }).format(fixed);

    const currencyString = '$' + fixed.toString();

    this.setState({ stringValue: currencyString });
  };

  updateInput = async (val: number) => {
    await this.updateIntVal(val);
    await this.setStringValue();
    this.checkValid();
    await this.constructBip70Payload();
  };

  deleteInput = async () => {
    const { floatVal } = this.state;
    const floatString = floatVal.toString().slice(0, -1);

    const int = parseFloat(floatString);
    const big = new BigNumber(floatString);
    if (!isNaN(int)) {
      await this.setState({
        floatVal: int,
        bigNumber: big,
        decimalPressed: false
      });
    } else {
      await this.setState({
        floatVal: 0,
        bigNumber: big,
        decimalPressed: false
      });
    }
    await this.setStringValue();
    this.checkValid();
  };

  clearInput = async () => {
    const { markInvalid } = this.props;
    const big = new BigNumber(0);
    await this.setState({
      floatVal: 0,
      bigNumber: big,
      decimalPressed: false
    });
    await this.setStringValue();
    markInvalid();
  }

  checkValid = () => {
    const { markValid, markInvalid } = this.props;
    const { bigNumber } = this.state;

    try {
      const value = bigNumber.c[0];
      if (value > 0) {
        markValid();
      }
    } catch (error) {
      markInvalid();
    }
  };

  updateIntVal = async (val: number) => {
    const { floatVal, decimalPressed } = this.state;
    let concat: string;
    concat = `${floatVal}${val}`;

    const canEdit = this.checkCanEdit(concat);

    if (decimalPressed) {
      const containsDecimal = /\./.test(concat);
      if (!containsDecimal) {
        concat = `${floatVal}.${val}`;
      }
    }

    if (canEdit) {
      const big = new BigNumber(concat);

      await this.setState({
        floatVal: parseFloat(concat),
        bigNumber: big
      });
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
    await this.setState({ selectedPaymentType: data });
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

  getUsdhAmount = async (fiatValue: number) => {
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
      const usdhAmount = await this.getUsdhAmount(floatVal);

      const userMemo = 'Payment of ' + usdhAmount + ' USDH to ' + companyName;

      const slpTxRequest: {
        token_id: string;
        slp_outputs: { address: string; amount: number }[];
        memo?: string;
      } = {
        token_id: tokenID,
        slp_outputs: [
          {
            address: 'simpleledger:qrnqklrz3dkc9vvzstqgtj25ntxlfzu6dgtdpjwrsa',
            amount: usdhAmount,
          },
        ],
        memo: userMemo,
      };
      return updateBip70Payload(slpTxRequest);
    } else {
      const userMemo =
        'Payment of $' +
        floatVal.toFixed(decimalPlaces) +
        ' worth of BCH to ' +
        companyName;

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
      } = {
        fiat: currency,
        outputs: [
          // {
          //   script: "76a914018a532856c45d74f7d67112547596a03819077188ac",
          //   amount: 700
          // },
          {
            address: 'bitcoincash:qrnqklrz3dkc9vvzstqgtj25ntxlfzu6dg8k2fmrwr',
            fiatAmount: floatVal.toFixed(decimalPlaces)
          }
        ],
        memo: userMemo,
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
          deleteInput={this.deleteInput}
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