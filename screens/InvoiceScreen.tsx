import React from "react"
import BigNumber from "bignumber.js";
import { Button, TouchableOpacity, TextInput, Text, View } from "react-native"
import axios, { AxiosResponse } from "axios";
import AsyncStorage from '@react-native-community/async-storage';
import { SvgUri } from 'react-native-svg';
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import BchInput from "../components/bch-input";

const bchaddr = require('bchaddrjs-slp');

const merchantBchAddress =
  'bitcoincash:qrnqklrz3dkc9vvzstqgtj25ntxlfzu6dg8k2fmrwr';
const merchantSlpAddress =
  'simpleledger:qrnqklrz3dkc9vvzstqgtj25ntxlfzu6dgtdpjwrsa';

export interface Props {
  location: object;
  history: any;
  navigation: any;
}

interface State {
  id: string;
  errorMsg: string;
  merchant: {
    currency: string;
    destinationAddress: string;
    companyName: string;
  };
  bip70Payload: object;
  isValid: boolean;
  floatVal: number;
  bigNumber: any;
  stringValue: string;
  leadingZero: boolean;
  optionalOutput: {
    address: string;
    msg: string;
  } | null;
  selectedPaymentType: {
    name: string;
    ticker: string;
    tokenID: string;
    decimal_count: number;
    imagePath: string;
  } | null;
}

export default class InvoiceScreen extends React.Component<Props, State> {
  state: State = {
    id: "",
    errorMsg: "",
    merchant: {
      currency: "",
      destinationAddress: "",
      companyName: ""
    },
    bip70Payload: {},
    isValid: false,
    floatVal: 0,
    bigNumber: new BigNumber(0),
    stringValue: '$0.00',
    leadingZero: false,
    optionalOutput: null,
    selectedPaymentType: null,
  };

  componentDidMount = () => {
    this.getMerchantInfo();
  };


  getMerchantID = async () => {
    try {
      const value = await AsyncStorage.getItem('merchant')
      return value;
    } catch (e) {

      throw new Error('error reading merchant');
    }
  }

  getMerchantInfo = async () => {
    const merchantInfo = await this.getMerchantID();

    const resp = await this.mockApiCall(merchantInfo);
    this.setState({ merchant: resp });
  };

  mockApiCall = async (apiKey: any) => {
    return {
      currency: "USD",
      destinationAddress: "asdf",
      companyName: "Test Merchant Name"
    };
  };

  updatePaymentValues = (obj: object) => {
    this.setState(obj);
  };

  addSelection = async (data: object) => {
    this.setState({ selectedPaymentType: data });
  };

  goToConfirmScreen = async () => {
    const { navigate } = this.props.navigation;
    const bip70Payload = await this.constructBip70Payload();
    navigate('Pay', {bip70Payload: bip70Payload});
  };

  setOptionalOutput = (address: string) => {
    try {
      const addr = bchaddr.toLegacyAddress(address);
      const optObj = {
        address: addr,
        msg: 'Would you like to leave a tip?',
      };
      this.setState({optionalOutput: optObj});
    } catch (err) {
      console.log(err);
      this.setState({optionalOutput: null});
    }
  }

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
      selectedPaymentType: { tokenID },
      merchant: {companyName, currency},
      optionalOutput,
    } = this.state;
    const decimalPlaces = 2;

    const isSLP = tokenID !== '';

    if (isSLP) {
      // const spiceAmount = await this.getSpiceAmount(floatVal);
      const usdhAmount = this.getUsdhAmount(floatVal);

      const userMemo = 'Payment of ' + usdhAmount + ' USDH to ' + companyName;

      const slpTxRequest: {
        token_id: string;
        slp_outputs: {address: string; amount: number}[];
        memo?: string;
        fiatTotal?: number;
        optional_output?: {
          address: string;
          msg: string;
        } | null;
      } = {
        token_id: tokenID,
        slp_outputs: [
          {
            address: bchaddr.toLegacyAddress(merchantSlpAddress), // Legacy only
            amount: usdhAmount,
          },
        ],
        memo: userMemo,
        fiatTotal: usdhAmount,
        optional_output: optionalOutput,
      };
      return slpTxRequest;
    } else {
      const fiatTotal = floatVal.toFixed(decimalPlaces);
      const userMemo =
        'Payment of $' + fiatTotal + ' worth of BCH to ' + companyName;

      const bchPrice = await this.getBCHPrice();
      const bchAmount = parseFloat(fiatTotal) / parseFloat(bchPrice);

      const bchTxRequest: {
        outputs: {
          script?: string;
          amount?: number;
          fiatAmount?: any;
          address?: string;
          slpConvertAddress?: string;
        }[];
        currency?: string;
        fiat?: string;
        fiatRate?: number;
        memo?: string;
        fiatTotal?: number;
        optional_output?: {
          address: string;
          msg: string;
        } | null;
      } = {
        fiat: currency,
        outputs: [
          // {
          //   script: "76a914018a532856c45d74f7d67112547596a03819077188ac",
          //   amount: 700
          // },
          {
            address: bchaddr.toLegacyAddress(merchantBchAddress), // Legacy only
            amount: Math.ceil(bchAmount * 100000000),
            fiatAmount: floatVal.toFixed(decimalPlaces),
            slpConvertAddress: merchantSlpAddress,
          }
        ],
        memo: userMemo,
        fiatTotal: parseFloat(fiatTotal),
        optional_output: optionalOutput,
      };

      return bchTxRequest;
    }
  };

  render(): JSX.Element {
    const {
      merchant: { companyName },
      isValid,
      stringValue,
      floatVal,
      bigNumber,
      leadingZero,
      selectedPaymentType,
    } = this.state;

    return (
      <Container>

        <BchInput
          companyName={companyName}
          addSelection={this.addSelection}
          selectedPaymentType={selectedPaymentType}
          isValid={isValid}
          stringValue={stringValue}
          floatVal={floatVal}
          bigNumber={bigNumber}
          leadingZero={leadingZero}
          updatePaymentValues={this.updatePaymentValues}
          setOptionalOutput={this.setOptionalOutput}
        />

        {isValid && (
          <SubmitButton onPress={this.goToConfirmScreen}>
            <SubmitText>Submit</SubmitText>
          </SubmitButton>
        )}
      </Container>
    );
  }
}

const Container = styled.View`
  flex: 1;
  background-color: #fbfcff;
`;

const SubmitButton = styled.TouchableOpacity`
  justify-content: center;
  height: 100;
  margin-top: 10;
  background-color: #841584;
`;

const SubmitText = styled.Text`
  font-size: 40;
  font-weight: 400;
  color: #fff;
  text-align: center;
  text-align-vertical: center;
`;
