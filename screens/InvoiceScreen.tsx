import React from "react"
import { Button, TouchableHighlight, TextInput, Text, View } from "react-native"
import axios, { AxiosResponse } from "axios";
import AsyncStorage from '@react-native-community/async-storage';
import { SvgUri } from 'react-native-svg';
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import BchInput from "../components/bch-input";

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

  updateBip70Payload = (obj: object) => {
    this.setState({ bip70Payload: obj });
  };

  markValid = () => {
    this.setState({ isValid: true });
  };
  markInvalid = () => {
    this.setState({ isValid: false });
  };

  goToConfirmScreen = () => {
    const { bip70Payload } = this.state;
    const { navigate } = this.props.navigation;
    navigate('Pay', {bip70Payload: bip70Payload});
  }

  render(): JSX.Element {
    const {
      merchant: { companyName },
      isValid,
    } = this.state;

    return (
      <Container>

        <BchInput
          companyName={companyName}
          markValid={this.markValid}
          markInvalid={this.markInvalid}
          updateBip70Payload={this.updateBip70Payload}
        />

      {isValid && (
        <Button
          onPress={this.goToConfirmScreen}
          title="Submit"
          color="#841584"
        />
      )}

      </Container>
    );
  }
}

const Container = styled.View`
  flex: 1;
  background-color: #FBFCFF;
`;
