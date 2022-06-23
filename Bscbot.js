require('dotenv').config();
const ccxt = require('ccxt');
const axios = require('axios');

const bscTick = async(config, binanceClient) => {
    const { asset, base, spread, allocation } = config;
    const market = `${asset}/${base}`;

    //cancel open orders left from previous tick, if any
    const orders = await binanceClient.fetchOpenOrders(market);
    orders.forEach(async order => {
        await binanceClient.cancelOrder(order.id, market);
    });

    const results = await Promise.all ([
        axios.get('https://testnet.binance.vision/api/v3/avgPrice?symbol=ETHUSDT')
        ]);
    const marketPrice = results [0].data?.bestAsk

    //calculate new orders parameters
    const sellPrice = marketPrice * (1 + spread);
    const buyPrice = marketPrice * (1 - spread);
    const balances = await binanceClient.fetchBalance();
    const assetBalance = balances.free[asset]; //e.g. 0.01 Eth
    const baseBalance= balances.free[base]; // e.g. 20 USDT
    const sellVolume = assetBalance * allocation;
    const buyVolume = (baseBalance * allocation) / marketPrice;

    await binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
    await binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);

    console.log(`
        New bscTick for ${market}...
        Created limit sell order for ${sellVolume}@${sellPrice}
        Create limit buy order for ${buyVolume}@${buyPrice}
    `);
};

const bscRun = () => {
    const config = {
        asset: 'ETH',
        base: 'USDT',
        allocation: 0.1, //Percentage of our available funds that we trade
        spread: 0.05,     //Percentage above and below market prices for sell and buy orders
        bscTickInterval: 3000 //Duration between each tick, in milliseconds       
    };
    const binanceClient = new ccxt.binance({
        apiKey: process.env.REACT_APP_BSC_KEY,
        secret: process.env.REACT_APP_BSC_SECRET,
    });
    bscTick(config, binanceClient);
    setInterval(bscTick, config.bscTickInterval, config, binanceClient);
};

bscRun();