import React from "react"
import { ActivityIndicator, Image, TouchableHighlight, TextInput, Text, View } from "react-native"
import AsyncStorage from '@react-native-community/async-storage';
import axios, { AxiosResponse } from "axios";
import { SvgUri } from 'react-native-svg';
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export interface Props {
  navigation: any
}

interface State {
  isValid: boolean;
  id: string;
  paymentData: null | object;
  errorMsg: string;
  response: object;
}

export default class Init extends React.Component<Props, State> {

  state: State = {
    isValid: false,
    id: '',
    paymentData: null,
    errorMsg: '',
    response: {}
  };

  componentDidMount = async () => {
    // const merchantID = await this.getMerchantID();
    const { navigation } = this.props;
    const bip70Payload = navigation.getParam('bip70Payload');
    this.submitPayload(bip70Payload);
  }

  submitPayload = async (bip70Payload) => {
    const { data }: AxiosResponse = await axios.post(
      `https://pay.bitcoin.com/create_invoice`,
      bip70Payload
    );
    this.setState({ paymentData: data })
  };

  markValid() {
    this.setState({ isValid: true });
  }

  markInvalid() {
    this.setState({ isValid: false });
  }

  handleOnChange = (e: any) => {
    const value: string = e;
    if (value.length >= 4) {
      this.markValid();
    } else {
      this.markInvalid();
    }

    this.setState({ id: value });
  };

  handlePress = () => {
    // this.props.navigation.popToTop();
    const { navigate } = this.props.navigation;
    navigate('Invoice');
  }

  _onLoad = () => {
    this.setState({ loaded: true })
  }


  render() {
    const { isValid, paymentData, loaded } = this.state
    let qrUrl;
    let headerText = 'Loading...'
    if (paymentData) {
      qrUrl = paymentData.paymentUrl.replace('/i/', '/qr/');
      headerText = 'Scan QR code to pay $' + paymentData.fiatTotal + ' in USDH';
    }

    return (
      <Container>
        <HeaderText>{headerText}</HeaderText>
        {!loaded && <ActivityIndicator size="large" color="#0000ff" />}
        {qrUrl && (
          <Image
            style={{ width: 300, height: 300 }}
            source={{uri: qrUrl}}
            onLayout={this._onLoad}
            fadeDuration={0}
          />
        )}

        <ProceedButton
          onPress={this.handlePress}
          style={{backgroundColor: '#5551c9'}}>
          <ButtonText>Cancel</ButtonText>
        </ProceedButton>
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
`;

const ButtonText = styled.Text`
  text-align:center;
  font-weight: 700;
  color: #ffffff;
`;

const ProceedButton = styled.TouchableHighlight`
  background-color: #b0aed6;
  border-radius: 100px;
  width: ${wp('40%')};
  margin-top:${hp('4%')};
  padding: 20px 0;
`;