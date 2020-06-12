import React from "react"
import { NativeModules, Text, View } from "react-native"
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { TokenSelection } from "./tokenSelection";


const defaultTheme = '#5451c9';


const mockupArray = [
  {
    tokenID: 'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479',
    imagePath: 'https://tokens.bch.sx/128/c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479.png',
    localImage: require('../../assets/usdh.png'),
    name: 'USDH',
    ticker: 'USDH',
    decimal_count: 8
  },
  {
    name: "Bitcoin Cash",
    ticker: "BCH",
    tokenID: "",
    decimal_count: 8,
    imagePath: 'https://learnbitcoin.cash/bch.png',
    localImage: require('../../assets/bch.png'),
  },
  /*{
    tokenID: "4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf",
    imagePath: 'https://learnbitcoin.cash/spice.svg',
    name: "SPICE",
    ticker: "SPICE",
    decimal_count: 8
  } */
];

console.log('mockupArray', mockupArray);

export interface PaymentProps {
  addSelection: Function;
  selectedPaymentType: {
    name: string;
    ticker: string;
    tokenID: string;
    decimal_count: number;
    imagePath: string;
  };
  constructBip70Payload: Function;
}

interface PaymentState { }

export class Payment extends React.Component<PaymentProps, PaymentState> {
  state: PaymentState = {};

  componentDidMount = async () => {
    // set BCH as default
    const { addSelection } = this.props;
    await addSelection(mockupArray[0]);
  };

  render(): JSX.Element {
    const {
      addSelection,
      selectedPaymentType,
      constructBip70Payload,
    } = this.props;
    if (selectedPaymentType === null) {
      return null;
    }

    return (
      <Container>
        <HeaderText>Pay with</HeaderText>
        {mockupArray.map((x, i) => {
          const isSelected = selectedPaymentType.ticker === x.ticker;

          return (
            <TokenSelection
              key={i}
              token={x}
              active={isSelected}
              addSelection={addSelection}
              constructBip70Payload={constructBip70Payload}
            />
          );
        })}
      </Container>
    );
  }
}



const Container = styled.View`
  margin-top:${hp('2%')};
`;


const HeaderText = styled.Text`
  font-weight: 100;
  text-align:left;
  font-size: ${wp('5%')};
  color: ${defaultTheme};
  margin-left:${wp('5%')};
  margin-top:${hp('4%')};
`;


