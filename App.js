import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet, Button, Image } from 'react-native';
import Swipelist from 'react-native-swipeable-list-view';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import articles from './articles.json'
import RNBootSplash from "react-native-bootsplash";


var timerRef = null;
var page = 1;

const API_KEY = 'gtrqShpINf7jqzSjnpuupcqBAnD662bOzuOa1geE1wc';
const API_URL = 'https://api.newscatcherapi.com/v2/latest_headlines?countries=US&topic=business&page_size=100';

const App = () => {
    const [headlines, setHeadlines] = useState([]);
    const [pinnedItems, setPinnedItems] = useState([]);
    const [APICallDone, setAPICallDone] = useState(false);
    const fetchArticles = async (page) => {
        try {
            const resposne = await axios.get(`${API_URL}&page=${page}`, {
                headers: {
                    'x-api-key': API_KEY
                }
            });
            if (resposne.status == 200) {
                RNBootSplash.hide({ fade: true, duration: 500 });
                setAPICallDone(true)
                await AsyncStorage.setItem('headlines', JSON.stringify(resposne.data.articles));
                // await AsyncStorage.setItem('headlines', JSON.stringify(articles.articles));
                const storedHeadlines = await AsyncStorage.getItem('headlines');
                const parsedHeadlines = JSON.parse(storedHeadlines);
                const batch = parsedHeadlines.splice(0, 10);
                setHeadlines((prevHeadlines) => [...batch, ...prevHeadlines,]);
                await AsyncStorage.setItem('headlines', JSON.stringify(parsedHeadlines));
            } else {
                clearInterval(timerRef);
                timerRef = null;
                setAPICallDone(false)
            }
        } catch (error) {
            console.log(error.response);
            clearInterval(timerRef);
            timerRef = null;
            setAPICallDone(false)
        }
    }
    useEffect(() => {
        fetchArticles(page)
    }, [])
    useEffect(() => {
        if (APICallDone) {
            timerRef = setInterval(fetchAndDisplayHeadlines, 10000);
            return () => {
                clearInterval(timerRef);
                timerRef = null;
            };
        }
    }, [APICallDone])

    const fetchAndDisplayHeadlines = async () => {
        try {
            const storedHeadlines = await AsyncStorage.getItem('headlines');
            const parsedHeadlines = JSON.parse(storedHeadlines);
            const batch = parsedHeadlines.splice(0, 5);
            if (parsedHeadlines.length === 0) {
                clearInterval(timerRef);
                timerRef = null;
                page = page + 1;
                setAPICallDone(false);
                await new Promise(resolve => setTimeout(resolve, 1000));
                fetchArticles(page);
            }
            setHeadlines((prevHeadlines) => [...batch, ...prevHeadlines,]);
            await AsyncStorage.setItem('headlines', JSON.stringify(parsedHeadlines));
        } catch (error) {
            clearInterval(timerRef);
            timerRef = null;
        }
    };

    const onButtonPress = () => {
        clearInterval(timerRef);
        timerRef = null;
        fetchAndDisplayHeadlines()
        timerRef = setInterval(fetchAndDisplayHeadlines, 10000);
    }

    const handleDelete = (data) => {
        const updatedHeadlines = headlines.filter((i, _) => i._id !== data._id);
        setHeadlines(updatedHeadlines);
        const updatePinnedItems = pinnedItems.filter((i, _) => i._id !== data._id);
        setPinnedItems(updatePinnedItems);
    };

    const handlePin = (data) => {
        const tempHeaderLines = headlines.map(item => ({
            ...item,
            isPinned: item._id === data._id ? !item.isPinned : item.isPinned
        }));

        setHeadlines(tempHeaderLines);
        if (data.isPinned === undefined || !data.isPinned) {
            data.isPinned = true;
            setPinnedItems((prevPinnedItems) => [data, ...prevPinnedItems])
        } else {
            setPinnedItems(pinnedItems.filter(i => i._id != data._id));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Button title='Fetch New Batch' onPress={onButtonPress} />
            <ScrollView>
                <Swipelist
                    data={pinnedItems}
                    renderRightItem={(item) => (
                        <View style={styles.headlineContainer}>
                            <Image source={item.media ? { uri: item.media } : require('./assets/empty.jpg')} style={{ width: 50, height: 40 }} />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.headlineTitle}>{item.title}</Text>
                                <Text style={styles.headlineExcerpt}>{item.excerpt}</Text>
                            </View>
                        </View>
                    )}
                    renderHiddenItem={(data, index) => (
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                style={[styles.rightAction, { backgroundColor: '#bfbfbf' }]}
                                onPress={() => handlePin(data)}
                            >
                                <Text>{data.isPinned ? 'Un Pin' : 'Pin'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.rightAction, { backgroundColor: 'red' }]}
                                onPress={() => handleDelete(data)}
                            >
                                <Text>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    rightOpenValue={200}
                />
                <Swipelist
                    data={headlines}
                    renderRightItem={(item) => (
                        !item.isPinned ?
                            <View style={styles.headlineContainer}>
                                <Image source={item.media ? { uri: item.media } : require('./assets/empty.jpg')} style={{ width: 50, height: 40 }} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.headlineTitle}>{item.title}</Text>
                                    <Text style={styles.headlineExcerpt}>{item.excerpt}</Text>
                                </View>
                            </View> : <></>
                    )}
                    renderHiddenItem={(data, index) => (
                        <View style={{ flexDirection: 'row', alignContent: 'center' }}>
                            <TouchableOpacity
                                style={[styles.rightAction, { backgroundColor: '#bfbfbf' }]}
                                onPress={() => handlePin(data)}
                            >
                                <Text>{data.isPinned ? 'Un Pin' : 'Pin'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.rightAction, { backgroundColor: 'red' }]}
                                onPress={() => handleDelete(data)}
                            >
                                <Text>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    rightOpenValue={200}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    splashImage: {
        width: 200,
        height: 200,
    },
    headlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    headlineTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
    headlineExcerpt: {
        fontSize: 14,
        color: 'gray',
    },
    rightAction: {
        width: '100%',
        // marginVertical: 10,
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});