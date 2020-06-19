import React from "react"
import { NativeModules, Image, TextInput, TouchableHighlight, Text, View } from "react-native"
import styled from 'styled-components';
import { SvgUri } from 'react-native-svg'; import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';



const defaultTheme = '#5451c9';

export interface Props {
  token: {
    name: string;
    ticker: string;
    tokenID: string;
    decimal_count: number;
    imagePath: string;
  };
  active?: boolean;
  addSelection: Function;
  constructBip70Payload: Function;
}

interface State {
  active: boolean;
}

export class TokenSelection extends React.Component<
  Props,
  State
  > {
  state: State = {
    active: false
  };

  componentDidMount = () => { };

  render(): JSX.Element {
    const { token, addSelection, active, constructBip70Payload } = this.props;
    const isSVG = token.imagePath.includes(".svg")
    const isLocal = token.imagePath.includes("http")

    return (
      <BaseContainer clickable={false}>
        <TokenChoice style={{ backgroundColor: active ? defaultTheme : '#FBFCFF' }} onPress={async () => {
          await addSelection(token);
          await constructBip70Payload();
        }}>


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


            <DescriptionText style={{ color: active ? '#ffffff' : defaultTheme }}>
              {token.ticker.toUpperCase()}
            </DescriptionText>
          </Container>
        </TokenChoice>
      </BaseContainer>
    );
  }
}


const BaseContainer = styled.View`
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


