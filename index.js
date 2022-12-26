const {Configuration, OpenAIApi} = require('openai');
const TG = require('telegram-bot-api');
require('dotenv').config();

const configuration = new Configuration({apiKey: process.env.OPENAI_API_KEY});
const openai = new OpenAIApi(configuration);

const telegram = new TG({token: process.env.TELEGRAM_BOT_TOKEN});
telegram.setMessageProvider(new TG.GetUpdateMessageProvider());

const getCompletion = async (prompt, userId) => {
  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-002',
      prompt,
      max_tokens: 4070 - prompt.split(' ').length,
      user: `${userId}`,
    });

    return completion.data.choices
      .map(({text}) => text)
      .join('');
  } catch (error) {
    console.log('error', error);
    return 'error @#!';
  }
}

const main = async () => {
  await telegram.start();

  telegram.on('/start', async (update) => {
    await telegram.sendMessage({
      chat_id: update.message.chat.id, text: "Hello, Human!",
    });
  });

  telegram.on('update', async (update) => {
    const prompt = update.message?.text;

    if (!prompt) return;

    if(prompt === '/reset') {
      await getCompletion('Forgot previous topic', null);
    }

    if(prompt.split(/\s/g).length === 1 && prompt.startsWith('/')) {
      await telegram.sendMessage({
        chat_id: update.message.chat.id, text: "Hello, Human!",
      });

      return;
    }

    console.log('prompt', prompt);
    const message = await getCompletion(prompt, update.message.chat_id);

    console.log('message', message);

    await telegram.sendMessage({
      chat_id: update.message.chat.id, text: message,
    });
  });
};

const run = async () => {
  try {
    await main();
  } catch (error) {
    console.log('error', error);
    await run();
  }

  while(true) {
    console.log('running...');
    await new Promise(res => setTimeout(2000, res));
  }
}

run();
