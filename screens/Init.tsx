import React from "react"
import { TouchableHighlight, TextInput, Text, View } from "react-native"
import AsyncStorage from '@react-native-community/async-storage';
import { SvgUri } from 'react-native-svg';
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export interface Props {
  navigation: any
}

interface State {
  isValid: boolean;
  id: string;
  errorMsg: string;
  response: object;
}

export default class Init extends React.Component<Props, State> {

  state: State = {
    isValid: false,
    id: "",
    errorMsg: "",
    response: {}
  };

  componentDidMount = async () => {
    const merchantID = await this.getMerchantID();
    const { navigate } = this.props.navigation;

    if (merchantID !== undefined) {
      navigate('Invoice', {})
    }

  }

  markValid() {
    this.setState({ isValid: true });
  }

  markInvalid() {
    this.setState({ isValid: false });
  }

  getMerchantID = async () => {
    try {
      const value = await AsyncStorage.getItem('merchant')
      if (value !== null) {
        console.log('val', value);
      }
      return value;
    } catch (e) {

      throw new Error('error reading merchant');
    }
  }

  saveMerchantID = async (merchantID: any) => {
    const { navigate } = this.props.navigation;
    try {
      await AsyncStorage.setItem('merchant', merchantID.apiKey)
      navigate('Invoice')
    } catch (e) {
      throw new Error('error saving merchant');
    }
  };

  validateID = (id: string) => {
    // mock api response with merchant id
    const mockResponse = {
      apiKey: "asdjfew7yoyhafsadfa",
      success: true
    };

    this.setState({
      response: mockResponse,
      errorMsg: ""
    });

    if (!mockResponse.success) {
      return this.setState({ errorMsg: "invalid id" });
    }

    this.saveMerchantID(mockResponse);
  };

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

    const { id, isValid } = this.state
    this.validateID(id)
  }


  render() {
    const { isValid } = this.state


    return (
      <Container>
        <HeaderText>
          Welcome to your Bitcoin Cash Register
        </HeaderText>
        <SvgUri
          width={wp('80%')}
          height={hp('45%')}
          uri="https://learnbitcoin.cash/crypto.svg"
        />

        <LabelText >Enter merchant ID </LabelText>
        <MerchantInput onChangeText={this.handleOnChange} />

        <ProceedButton onPress={this.handlePress} style={{ backgroundColor: isValid ? '#5551c9' : '#b0aed6' }}>
          <ButtonText> Proceed</ButtonText>
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
  margin-bottom:10px;
`;

const HeaderText = styled.Text`
  font-size: 20px;
  font-weight: 500;
  color: #5551c9;
  margin-top: ${hp('10%')};
`;
const LabelText = styled.Text`
  font-size: 28px;
  font-weight: 700;
  color: #5551c9;
  margin-bottom: 5px;
`;
const ButtonText = styled.Text`
  text-align:center;
  font-weight: 700;
  color: #ffffff;
`;

const MerchantInput = styled.TextInput`
  border: 1px solid #eaeaea;
  border-radius: 5px;
  color: #5d5d5d;
  width: ${wp('70%')};
  font-size: 18px;
  padding: 10px;
`;

const ProceedButton = styled.TouchableHighlight`
  background-color: #b0aed6;
  border-radius: 100px;
  width: ${wp('40%')};
  margin-top:${hp('4%')};
  padding: 20px 0;
`;