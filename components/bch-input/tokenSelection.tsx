import React from "react"
import { NativeModules, Image, TextInput, TouchableHighlight, Text, View } from "react-native"
import styled from 'styled-components';
import { SvgUri } from 'react-native-svg'; import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { NavigationEvents } from 'react-navigation';

const defaultTheme = '#5451c9';

export interface Props {
  token: {
    name: string;
    ticker: string;
    tokenID: string;
    decimal_count: number;
    imagePath: string;
  };
  mockupArray: [
    {
      name: string;
      ticker: string;
      tokenID: string;
      decimal_count: number;
      imagePath: string;
    }
  ];
  active?: boolean;
  addSelection: Function;
  tokenIndex: number;
}

interface State {
  active: boolean;
}

export class TokenSelection extends React.Component<Props, State> {
  state: State = {
    active: false,
  };

  componentDidMount = () => { };

  handleLongPress = async () => {
    const {tokenIndex, mockupArray, addSelection} = this.props;
    let selectedToken;
    if (tokenIndex + 1 === mockupArray.length) {
      selectedToken = mockupArray[0];
    } else {
      selectedToken = mockupArray[tokenIndex + 1];
    }
    await addSelection(selectedToken);
  };

  render(): JSX.Element {
    const {token, addSelection, active, mockupArray} = this.props;
    const isSVG = token.imagePath.includes('.svg');

    return (
      <BaseContainer clickable={false}>
        <NavigationEvents
          onWillFocus={async () => {
            await addSelection(mockupArray[0]);
          }}
        />
        <TokenChoice 
          style={{ backgroundColor: active ? defaultTheme : '#FBFCFF' }}
          onLongPress={this.handleLongPress}>
          <Container>
            {isSVG ?
              <SvgUri
                width={wp('10%')}
                height={hp('10%')}
                uri={token.imagePath}
              /> :
              <Image
                style={{ display: 'flex', width: wp('18%'), height: hp('10%') }}
                source={token.localImage}
              />}

            <DescriptionText style={{color: active ? '#ffffff' : defaultTheme}}>
              {token.ticker.toUpperCase()}
            </DescriptionText>
          </Container>
        </TokenChoice>
      </BaseContainer>
    );
  }
}


const BaseContainer = styled.View`
  align-self: center;
  flex-direction: row;
`;

const TokenChoice = styled.TouchableHighlight`
  flex-direction: row;
  display:flex;
`;

const Container = styled.View`
  margin-top:${hp('2%')};
  width: ${wp('30%')};
  border-radius: 50;
  align-items: center;
  align-self: center;
`;




const DescriptionText = styled.Text`
  font-weight: 100;
  text-align:center;
  font-size: ${wp('5%')};
`;


