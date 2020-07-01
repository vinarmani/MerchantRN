import React from "react"
import {
  ActivityIndicator,
  SafeAreaView,
  TouchableHighlight,
  Text,
  View,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import axios, { AxiosResponse } from "axios";
import { SvgUri } from 'react-native-svg';
import styled from 'styled-components';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
  heightPercentageToDP,
} from 'react-native-responsive-screen';
import QRCode from 'react-native-qrcode-svg';
import { w3cwebsocket } from "websocket";
import { Buffer } from 'buffer';
const bchaddr = require('bchaddrjs-slp');

const slpDbUrl = 'https://slpdb.fountainhead.cash/q/';

export interface Props {
  navigation: any;
}

interface State {
  response: object;
}

export default class PayScreen extends React.Component<Props, State> {
  state: State = {
    response: [],
  };

  componentDidMount = async () => {
    // const merchantID = await this.getMerchantID();
    const { navigation } = this.props;
    const slpAddress = navigation.getParam('slpAddress');
    const response = await this.getTransactions(slpAddress);
    this.setState({response: response});
  };

  getTransactions = async (slpAddress) => {
    let query = {
      "v": 3,
      "q": {
        "db": ["c", "u"],
        "find":
        {
        "$or":
        [
          {
            "out.e.a": slpAddress
          }
        ],
        "slp.detail.tokenIdHex": "c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479"
        },
        "sort":
        {
          "blk.i": -1
        },
        "limit": 100
      },
      "r": {
        "f": "[.[] | { timestamp: .blk.t, txid: .tx.h, tokenDetails: .slp } ]"
      }
    };

    const json_str = JSON.stringify(query);
    const data = Buffer.from(json_str).toString('base64');
    const response = (await axios({
      method: 'GET',
      url: slpDbUrl + data,
      headers: null,
      json: true,
    })).data;

    const fullResponse = response.u.concat(response.c);
    const sortedResponse = fullResponse.map(txDetails => {
      const outputs = txDetails.tokenDetails.detail.outputs;
      const outTotal = outputs.reduce((accumulator, out) => {
        if (out.address == slpAddress) {
          return accumulator + parseFloat(out.amount);
        } else {
          return accumulator;
        }
      }, 0);
      const milliseconds = txDetails.timestamp * 1000;
      const dateObject = new Date(milliseconds);

      return {
        dateTime: dateObject.toLocaleString(),
        txid: txDetails.txid,
        outputTotal: outTotal,
      }
    });
    // console.log('sortedResponse', sortedResponse);
    return sortedResponse;
  };

  handlePress = () => {
    // this.props.navigation.popToTop();
    const { navigate } = this.props.navigation;
    navigate('Invoice');
  };

  render() {
    const { response } = this.state;

    let showList = false;
    if (response && response.length > 0) {
      showList = true;
    }

    return (
      <Container>
        <TouchableHighlight onPress={this.handlePress}>
          <HeaderText>Recent Transactions</HeaderText>
        </TouchableHighlight>
        {!showList && <ActivityIndicator size="large" color="#0000ff" />}
        {showList && (
          <FlatList
            data={response}
            renderItem={({item}) => (
              <Item>
                <ConfirmDate>{item.dateTime}</ConfirmDate>
                <Amount>{'$' + item.outputTotal}</Amount>
              </Item>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        )}
      </Container>
    );
  }
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #FBFCFF;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
`;

const Item = styled.View`
  background-color: #d9f7f7;
  padding: 20px;
  margin-vertical: 8;
  margin-horizontal: 16;
`;

const ConfirmDate = styled.Text`
  color: #1f9292;
  font-size: 22;
`;

const Amount = styled.Text`
  color: #072121;
  font-size: 32;
`;

const HeaderText = styled.Text`
  font-size: 20px;
  font-weight: 500;
  color: #5551c9;
  margin-top: ${hp('5%')};
  margin-bottom: 40px;
`;
