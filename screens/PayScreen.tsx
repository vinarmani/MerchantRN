import React from "react"
import { ActivityIndicator, Image, TouchableHighlight, TextInput, Text, View } from "react-native"
import AsyncStorage from '@react-native-community/async-storage';
import axios, { AxiosResponse } from "axios";
import { SvgUri } from 'react-native-svg';
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import QRCode from 'react-native-qrcode-svg';
import { w3cwebsocket } from "websocket";

export interface Props {
  navigation: any
}

interface State {
  isValid: boolean;
  id: string;
  paymentData: null | object;
  errorMsg: string;
  invoiceStatus: string;
  response: object;
}

export default class Init extends React.Component<Props, State> {

  state: State = {
    isValid: false,
    id: '',
    paymentData: null,
    errorMsg: '',
    invoiceStatus: 'open',
    response: {}
  };

  componentDidMount = async () => {
    // const merchantID = await this.getMerchantID();
    const { navigation } = this.props;
    const bip70Payload = navigation.getParam('bip70Payload');
    this.submitPayload(bip70Payload);
  }

  submitPayload = async (bip70Payload) => {
    const { paymentData } = this.state;
    if (paymentData) {
      return;
    }

    const { data }: AxiosResponse = await axios.post(
      'https://pay.bitcoin.com/create_invoice',
      bip70Payload
    );

    // Set up the websocket
    const client = new w3cwebsocket(
      `wss://pay.bitcoin.com/s/${data.paymentId}`,
      'echo-protocol',
    );

    client.onerror = async (e) => {
      console.log('Connection Error');
    }

    const self = this;
    client.onmessage = (e: any) => {
      if (typeof e.data === 'string') {
        const invoiceData = JSON.parse(e.data);
        self.handleOnChange(invoiceData);
      }
    }

    this.setState({ paymentData: data })
  };

  handleOnChange = (invoiceData: any) => {
    const { status } = invoiceData;
    if (status === 'paid' || status === 'expired') {
      this.setState({ paymentData: invoiceData });
    }
  };

  handlePress = () => {
    // this.props.navigation.popToTop();
    const { navigate } = this.props.navigation;
    navigate('Invoice');
  }

  render() {
    const { paymentData } = this.state
    let headerText = 'Preparing invoice...'
    let qrUri;
    if (paymentData) {
      headerText =
        paymentData.status == 'open'
          ? 'Scan QR code to pay $' +
            parseFloat(paymentData.fiatTotal).toFixed(2) +
            ' in ' +
            paymentData.paymentAsset
          : '';
      let qrPrefix =
        paymentData.paymentAsset == 'BCH' ? 'bitcoincash:' : 'simpleledger:';
      qrUri = qrPrefix + '?r=' + paymentData.paymentUrl;
    }

    return (
      <Container>
        <HeaderText>{headerText}</HeaderText>
        {!paymentData && <ActivityIndicator size="large" color="#0000ff" />}
        {paymentData && paymentData.status === 'open' && (
          <QRCode value={qrUri} size={200} ecl={'H'} />
        )}
        {paymentData && paymentData.status === 'paid' && (
          <Image source={require('../assets/paid_red.png')} />
        )}
        {paymentData && paymentData.status === 'expired' && (
          <HeaderText>Invoice Expired. Please try again.</HeaderText>
        )}

        <CancelButton
          onPress={this.handlePress}
          style={{backgroundColor: '#5551c9'}}>
          <ButtonText>
            {paymentData && paymentData.status === 'open' ? 'Cancel' : 'Exit'}
          </ButtonText>
        </CancelButton>
      </Container>
    )
  }
}

const Container = styled.View`
  flex: 1;
  background-color: #FBFCFF;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
`;

const HeaderText = styled.Text`
  font-size: 20px;
  font-weight: 500;
  color: #5551c9;
  margin-top: ${hp('5%')};
  margin-bottom: 40px;
`;

const ButtonText = styled.Text`
  text-align:center;
  font-weight: 700;
  color: #ffffff;
`;

const CancelButton = styled.TouchableHighlight`
  background-color: #b0aed6;
  border-radius: 100px;
  width: ${wp('40%')};
  margin-top:${hp('10%')};
  padding: 20px 0;
`;