/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);


// const response = await axios.get('https://api.newscatcherapi.com/v2/latest_headlines?countries=US&topic=business&page_size=100', {
//     headers: {
//         'x-api-key': '8l3G4gLgYSCFovMwp0RDbW26NXdEy1R0JREZBfakwLE'
//     }
// })