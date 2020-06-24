import React from "react"
import { NativeModules, TextInput, Text, View } from "react-native"
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const defaultTheme = '#5451c9';

export interface Props {
  stringValue: string;
}

interface State { }

export class Display extends React.Component<Props, State> {
  state: State = {};

  componentDidMount = () => { };

  render(): JSX.Element {
    const {stringValue} = this.props;

    return <InputDisplayText>{stringValue}</InputDisplayText>;
  }
}

const InputDisplayText = styled.Text`
  text-align:center;
  font-weight: 700;
  color: ${defaultTheme};
  font-size: ${wp('10%')};
  margin: ${wp('3%')}px ${wp('5%')}px;
`;
