export const connectFinnhubWS = (symbol: string, callback: (data: any) => void) => {
  const socket = new WebSocket(`wss://ws.finnhub.io?token=${process.env.FINNHUB_KEY}`);

  socket.onopen = () => {
    console.log('Connected to Finnhub WS');
    socket.send(JSON.stringify({ type: 'subscribe', symbol }));
  };

  socket.onmessage = (event) => {
    const parsed = JSON.parse(event.data);
    callback(parsed);
  };

  return socket;
};
