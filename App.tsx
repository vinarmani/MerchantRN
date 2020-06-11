import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import Init from './screens/Init';
import InvoiceScreen from './screens/InvoiceScreen';
import PayScreen from './screens/PayScreen';

const MainNavigator = createStackNavigator({
  // Init: {
  //   screen: Init, navigationOptions: {
  //     header: null,
  //   }
  // },
  Invoice: {
    screen: InvoiceScreen, navigationOptions: {
      header: null,
    }
  },
  Pay: {
    screen: PayScreen, navigationOptions: {
      header: null,
    }
  },
});

const App = createAppContainer(MainNavigator);

export default App;