import React from "react"
import { NativeModules, TextInput, TouchableHighlight, Text, View } from "react-native"
import styled from 'styled-components';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';


const defaultTheme = '#5451c9';

export interface KeypadProps {
  updateInput: Function;
  deleteInput: Function;
  handleDecimal: Function;
}

interface KeypadState { }

export class Keypad extends React.Component<KeypadProps, KeypadState> {
  state: KeypadState = {};

  componentDidMount = () => { };

  render(): JSX.Element {
    const { updateInput, deleteInput, handleDecimal } = this.props;

    return (
      <Container>
        <NumberInput onPress={() => updateInput(1)}>
          <NumberText> 1</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(2)}>
          <NumberText> 2</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(3)}>
          <NumberText> 3</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(4)}>
          <NumberText> 4</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(5)}>
          <NumberText> 5</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(6)}>
          <NumberText> 6</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(7)}>
          <NumberText> 7</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(8)}>
          <NumberText> 8</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(9)}>
          <NumberText> 9</NumberText>
        </NumberInput>
        <NumberInput onPress={() => handleDecimal()}>
          <NumberText> .</NumberText>
        </NumberInput>
        <NumberInput onPress={() => updateInput(0)}>
          <NumberText> 0</NumberText>
        </NumberInput>
        <NumberInput onPress={() => deleteInput()}>
          <NumberText> del</NumberText>
        </NumberInput>
      </Container >
    );
  }
}


const Container = styled.View`
  justify-content: center;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top:${hp('2%')};
`;


const NumberInput = styled.TouchableOpacity`
  width: ${wp('30%')};
  margin-top:${hp('5%')};
`;



const NumberText = styled.Text`
  font-weight: 100;
  text-align:center;
  font-size: ${wp('5%')};
  color: ${defaultTheme};
`;


